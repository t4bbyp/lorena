document.addEventListener("DOMContentLoaded", () => {
                  const container = document.getElementById("skills-container");

                  fetch("../jsons/skills.json")
                    .then((response) => response.json())
                    .then((skills) => {
                      let row;

                      skills.forEach((skill, index) => {
                        // Create a new row div every 6 items
                        if (index % 6 === 0) {
                          row = document.createElement("ul");
                          row.classList.add("skills-row");
                          container.appendChild(row);
                        }

                        const skillLi = document.createElement("li");
                        skillLi.classList.add("skill-item");
                        skillLi.innerHTML = `
                            <span class="skilly">
                              <img src="${skill.icon}" class="skill-img">
                              <span class="skill-name">${skill.name}</span>  
                            </span>
                          `;

                        row.appendChild(skillLi);
                      });
                    })
                    .catch((err) => console.error("Error loading skills:", err));
                });

                //todo list
                const todoBtn = document.querySelector(".todo_expand");
                const todo = document.querySelector(".todo");

                todoBtn.addEventListener("click", function () {
                  todo.classList.toggle("open");
                  this.classList.toggle("active");
                });
