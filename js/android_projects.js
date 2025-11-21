           fetch("../jsons/android_jsons.json")
                    .then((response) => response.json())
                    .then(data => {
                      const levels = data.levels;
                      const connections = data.connections;
                      const projects = data.projects;

                      const tab = document.querySelector(".project-tab");

                        const map = document.querySelector('.map');
                        const svg = map.querySelector('svg');
                        const maxX = Math.max(...levels.map(l => l.x));
                        svg.setAttribute("viewBox", `0 0 ${maxX + 10} 100`);
                        svg.style.width = `${maxX + 10}%`;


                        // create a curved path using percentages
                        function makeCurvePath(x1, y1, x2, y2) {
                        const dx = (x2 - x1) * 0.6;
                        const cx1 = x1 + dx;
                        const cy1 = y1;
                        const cx2 = x2 - dx;
                        const cy2 = y2;
                        return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
                        }

                        // Add levels
                        levels.forEach(l => {
                        const d = document.createElement('button');
                        d.className = 'level';
                        d.style.left = `${l.x}%`;
                        d.style.top  = `${l.y}%`;
                        d.dataset.level = l.id;
                        d.style.background = `url(${projects[l.id-1].thumbnail.link})`;
                        d.style.aspectRatio = `${projects[l.id-1].thumbnail.aspectRatio}`;
                        d.style.width = `${projects[l.id-1].thumbnail.width}`;
                        d.setAttribute("aria-label", `Open project ${projects[l.id - 1].name}`);

                        //Open project info tab
                        d.addEventListener('click', () => {
                            const id = l.id - 1;
                            tab.style.display = "block";
                            tab.innerHTML = "";

                            const projy = document.createElement("div");
                            projy.classList.add("project-base");
                            projy.innerHTML = `
                                <button class="close_btn" aria-label="Close project tab"></button>
                                <h1 class="project-ttl">${projects[id].name}</h1>
                                <span class="project-status">${projects[id].status}</span>
                                
                                <div class="project-info">
                                    
                                    <div class="carousel">
                                        <div class="container">

                                            <!-- Full-width images with number text -->
                                            <div class="img-container">
                                                <img src="${projects[id].imgs[0]}" class="imege">
                                            </div>

                                            <!-- Image text -->
                                            <div class="caption-container">
                                                <p id="caption"></p>
                                            </div>

                                            <!-- Thumbnail images -->
                                            
                                              <div class="row">
                                                <button class="small-prev">&#10094;</button>
                                                <div class="wrapper"></div>
                                                <button class="small-next">&#10095;</button>
                                              </div>
                                        </div>
                                    </div>
                                    
                                    <div class="project-desc">
                                        <div class="desc">
                                            ${projects[id].description}
                                        </div>
                                    </div>
                                </div>
                            `;


                            tab.appendChild(projy);

                            //Add the big images
                            const imgContainer = document.querySelector(".img-container");
                            const imege = document.querySelector(".imege");
                            const images = projects[id].imgs;
                            imege.style.aspectRatio = d.style.aspectRatio;
                            

                            //Add small images
                            const wrapper = document.querySelector(".wrapper");
                            images.forEach((img, i) => {
                              const smallImg = document.createElement('div');
                              smallImg.classList.add("column");
                              smallImg.style.aspectRatio = d.style.aspectRatio;

                              smallImg.innerHTML = `
                                <img class="demo cursor box_inner" src="${img}" style="width: 100%;" onclick="currentSlide(${i + 1})">
                              `;
                              
                              wrapper.appendChild(smallImg);
                            });

                           
                            //Close the tab
                            const closeProject = projy.querySelector(".close_btn");

                            closeProject.addEventListener("click", () => {
                              projy.remove();
                              tab.style.display = "none";
                            });
                        });

                        map.appendChild(d);
                        });

                        // Add curved paths
                        connections.forEach(([a, b]) => {
                        const A = levels.find(l => l.id === a);
                        const B = levels.find(l => l.id === b);

                        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        path.setAttribute('d', makeCurvePath(A.x, A.y, B.x, B.y));
                        svg.appendChild(path);
                        });
                        
                    map.addEventListener("wheel", (e) => {
                      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                        e.preventDefault();
                        map.scrollLeft += e.deltaY * 4;
                      }
                    });


                    })
                    .catch((err) => console.error("Error loading info:", err));

                    
