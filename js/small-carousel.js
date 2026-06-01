// small-carousel.js
// Re-initialize the small image carousel for each opened project.
// This code assumes thumbnails are .column elements inside .wrapper
// and controls are .small-prev and .small-next inside the same project container.

(function () {
  // helper to safely test for GSAP plugins/objects
  const hasDraggable = typeof window.Draggable !== "undefined";
  const hasInertia = typeof window.InertiaPlugin !== "undefined";

  // Init when a project tab is opened. We listen for clicks that create a project-base,
  // then initialize only for that project's wrapper (prevents double-init).
  document.addEventListener("click", (e) => {
    const projBase = e.target.closest(".project-base");
    if (!projBase) return;

    // Use a flag to avoid initializing the same project twice
    if (projBase.dataset.smallCarouselInitialized === "true") return;
    projBase.dataset.smallCarouselInitialized = "true";

    const wrapper = projBase.querySelector(".wrapper");
    if (!wrapper) return;

    // collect thumbnail columns that were dynamically added by web_projects.js
    const columns = gsap.utils.toArray(projBase.querySelectorAll(".column"));
    if (columns.length === 0) return;

    const canMove = columns.length > 5;

    let activeElement;

    // create the loop timeline for JUST these columns
    const loop = horizontalLoop(columns, {
      paused: true,
      draggable: canMove, // only enable drag if more than 4
      onChange: (element, index) => {
        activeElement && activeElement.classList.remove("active");
        element.classList.add("active");
        activeElement = element;

        // Update the big image
        const bigImg = projBase.querySelector(".img-container .imege");
        if (bigImg) {
          const newSrc = element.querySelector("img").src;
          bigImg.src = newSrc;
        }
      }
    });

    // Prev / Next buttons scoped to this project
    const nextBtn = projBase.querySelector(".small-next");
    const prevBtn = projBase.querySelector(".small-prev");

    if (canMove) {
      if (nextBtn) nextBtn.addEventListener("click", () => loop.next({ duration: 0.4, ease: "power1.inOut" }));
      if (prevBtn) prevBtn.addEventListener("click", () => loop.previous({ duration: 0.4, ease: "power1.inOut" }));
      // Clicking a thumbnail scrolls to it (for small sets)
      columns.forEach((column, i) => {
        column.addEventListener("click", () => {
          if (activeElement) activeElement.classList.remove("active");
          column.classList.add("active");
          activeElement = column;
          curIndex = i; // ✅ keep the index in sync
          const bigImg = projBase.querySelector(".img-container .imege");
          if (bigImg) bigImg.src = column.querySelector("img").src;
        });
      });
    } else {
      // manual cycling for small carousels
      curIndex = 0; // start from first image

      function showImage(index) {
        if (activeElement) activeElement.classList.remove("active");
        const newActive = columns[index];
        newActive.classList.add("active");
        activeElement = newActive;

        const bigImg = projBase.querySelector(".img-container .imege");
        if (bigImg) {
          bigImg.src = newActive.querySelector("img").src;
        }
      }

      if (nextBtn)
        nextBtn.addEventListener("click", () => {
          curIndex = (curIndex + 1) % columns.length; // loop forward
          showImage(curIndex);
        });

      if (prevBtn)
        prevBtn.addEventListener("click", () => {
          curIndex = (curIndex - 1 + columns.length) % columns.length; // loop backward
          showImage(curIndex);
        });

      // Clicking a thumbnail scrolls to it (for small sets)
      columns.forEach((column, i) => {
        column.addEventListener("click", () => {
          if (activeElement) activeElement.classList.remove("active");
          column.classList.add("active");
          activeElement = column;
          curIndex = i; // ✅ keep the index in sync
          const bigImg = projBase.querySelector(".img-container .imege");
          if (bigImg) bigImg.src = column.querySelector("img").src;
        });
      });
    }

        // optional: expose for debugging (remove if you want)
        projBase._smallLoop = loop;
        // end init for this project
    
    });

  // ---------- PATCHED horizontalLoop ----------
  // Use the user's original horizontalLoop implementation but patch the Draggable check
  // We'll include the full function here to ensure the fix is in place.
  function horizontalLoop(items, config) {
    let timeline;
    items = gsap.utils.toArray(items);
    config = config || {};
    gsap.context(() => {
      let onChange = config.onChange,
        lastIndex = 0,
        tl = gsap.timeline({
          repeat: config.repeat,
          onUpdate: onChange && function () {
            let i = tl.closestIndex();
            if (lastIndex !== i) {
              lastIndex = i;
              onChange(items[i], i);
            }
          },
          paused: config.paused,
          defaults: { ease: "none" },
          onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100)
        }),
        length = items.length,
        startX = items[0].offsetLeft,
        times = [],
        widths = [],
        spaceBefore = [],
        xPercents = [],
        curIndex = 0,
        indexIsDirty = false,
        center = config.center,
        pixelsPerSecond = (config.speed || 1) * 100,
        snap = config.snap === false ? v => v : gsap.utils.snap(config.snap || 1),
        timeOffset = 0,
        container = center === true ? items[0].parentNode : gsap.utils.toArray(center)[0] || items[0].parentNode,
        totalWidth,
        getTotalWidth = () => items[length - 1].offsetLeft + xPercents[length - 1] / 100 * widths[length - 1] - startX + spaceBefore[0] + items[length - 1].offsetWidth * gsap.getProperty(items[length - 1], "scaleX") + (parseFloat(config.paddingRight) || 0),
        populateWidths = () => {
          let b1 = container.getBoundingClientRect(), b2;
          items.forEach((el, i) => {
            widths[i] = parseFloat(gsap.getProperty(el, "width", "px"));
            xPercents[i] = snap(parseFloat(gsap.getProperty(el, "x", "px")) / widths[i] * 100 + gsap.getProperty(el, "xPercent"));
            b2 = el.getBoundingClientRect();
            spaceBefore[i] = b2.left - (i ? b1.right : b1.left);
            b1 = b2;
          });
          gsap.set(items, {
            xPercent: i => xPercents[i]
          });
          totalWidth = getTotalWidth();
        },
        timeWrap,
        populateOffsets = () => {
          timeOffset = center ? tl.duration() * (container.offsetWidth / 2) / totalWidth : 0;
          center && times.forEach((t, i) => {
            times[i] = timeWrap(tl.labels["label" + i] + tl.duration() * widths[i] / 2 / totalWidth - timeOffset);
          });
        },
        getClosest = (values, value, wrap) => {
          let i = values.length,
            closest = 1e10,
            index = 0, d;
          while (i--) {
            d = Math.abs(values[i] - value);
            if (d > wrap / 2) {
              d = wrap - d;
            }
            if (d < closest) {
              closest = d;
              index = i;
            }
          }
          return index;
        },
        populateTimeline = () => {
          let i, item, curX, distanceToStart, distanceToLoop;
          tl.clear();
          for (i = 0; i < length; i++) {
            item = items[i];
            curX = xPercents[i] / 100 * widths[i];
            distanceToStart = item.offsetLeft + curX - startX + spaceBefore[0];
            distanceToLoop = distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");
            tl.to(item, { xPercent: snap((curX - distanceToLoop) / widths[i] * 100), duration: distanceToLoop / pixelsPerSecond }, 0)
              .fromTo(item, { xPercent: snap((curX - distanceToLoop + totalWidth) / widths[i] * 100) }, { xPercent: xPercents[i], duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond, immediateRender: false }, distanceToLoop / pixelsPerSecond)
              .add("label" + i, distanceToStart / pixelsPerSecond);
            times[i] = distanceToStart / pixelsPerSecond;
          }
          timeWrap = gsap.utils.wrap(0, tl.duration());
        },
        refresh = (deep) => {
          let progress = tl.progress();
          tl.progress(0, true);
          populateWidths();
          deep && populateTimeline();
          populateOffsets();
          deep && tl.draggable && tl.paused() ? tl.time(times[curIndex], true) : tl.progress(progress, true);
        },
        onResize = () => refresh(true),
        proxy;
      gsap.set(items, { x: 0 });
      populateWidths();
      populateTimeline();
      populateOffsets();
      window.addEventListener("resize", onResize);
      function toIndex(index, vars) {
        vars = vars || {};
        (Math.abs(index - curIndex) > length / 2) && (index += index > curIndex ? -length : length);
        let newIndex = gsap.utils.wrap(0, length, index),
          time = times[newIndex];
        if (time > tl.time() !== index > curIndex && index !== curIndex) {
          time += tl.duration() * (index > curIndex ? 1 : -1);
        }
        if (time < 0 || time > tl.duration()) {
          vars.modifiers = { time: timeWrap };
        }
        curIndex = newIndex;
        vars.overwrite = true;
        gsap.killTweensOf(proxy);
        return vars.duration === 0 ? tl.time(timeWrap(time)) : tl.tweenTo(time, vars);
      }
      tl.toIndex = (index, vars) => toIndex(index, vars);
      tl.closestIndex = setCurrent => {
        let index = getClosest(times, tl.time(), tl.duration());
        if (setCurrent) {
          curIndex = index;
          indexIsDirty = false;
        }
        return index;
      };
      tl.current = () => indexIsDirty ? tl.closestIndex(true) : curIndex;
      tl.next = vars => toIndex(tl.current() + 1, vars);
      tl.previous = vars => toIndex(tl.current() - 1, vars);
      tl.times = times;
      tl.progress(1, true).progress(0, true);
      if (config.reversed) {
        tl.vars.onReverseComplete();
        tl.reverse();
      }

      // ====== PATCHED: Properly check for Draggable object availability ======
      if (config.draggable && hasDraggable) {
        proxy = document.createElement("div");
        let wrap = gsap.utils.wrap(0, 1),
          ratio, startProgress, draggable, dragSnap, lastSnap, initChangeX, wasPlaying,
          align = () => tl.progress(wrap(startProgress + (draggable.startX - draggable.x) * ratio)),
          syncIndex = () => tl.closestIndex(true);

        if (!hasInertia) {
          console.warn("InertiaPlugin not found. Momentum-based scrolling and snapping will be limited.");
        }
        draggable = Draggable.create(proxy, {
          trigger: items[0].parentNode,
          type: "x",
          onPressInit() {
            let x = this.x;
            gsap.killTweensOf(tl);
            wasPlaying = !tl.paused();
            tl.pause();
            startProgress = tl.progress();
            refresh();
            ratio = 1 / totalWidth;
            initChangeX = (startProgress / -ratio) - x;
            gsap.set(proxy, { x: startProgress / -ratio });
          },
          onDrag: align,
          onThrowUpdate: align,
          overshootTolerance: 0,
          inertia: !!hasInertia, // use inertia only if plugin exists
          snap(value) {
            if (Math.abs(startProgress / -ratio - this.x) < 10) {
              return lastSnap + initChangeX;
            }
            let time = -(value * ratio) * tl.duration(),
              wrappedTime = timeWrap(time),
              snapTime = times[getClosest(times, wrappedTime, tl.duration())],
              dif = snapTime - wrappedTime;
            Math.abs(dif) > tl.duration() / 2 && (dif += dif < 0 ? tl.duration() : -tl.duration());
            lastSnap = (time + dif) / tl.duration() / -ratio;
            return lastSnap;
          },
          onRelease() {
            syncIndex();
            draggable.isThrowing && (indexIsDirty = true);
          },
          onThrowComplete: () => {
            syncIndex();
            wasPlaying && tl.play();
          }
        })[0];
        tl.draggable = draggable;
      }
      // ====== end PATCHED draggable block ======

      tl.closestIndex(true);
      lastIndex = curIndex;
      onChange && onChange(items[curIndex], curIndex);
      timeline = tl;
      return () => window.removeEventListener("resize", onResize);
    });
    return timeline;
  }
  // ---------- end horizontalLoop ----------
})();
