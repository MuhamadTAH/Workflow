
const root = document.getElementById('root');

if (root) {
  root.innerHTML = `
    <main class="container">
      <div class="agent-node">
        <div class="connector-port in"></div>
        <div class="agent-content">
          <div class="agent-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 64 64" class="brain-icon">
              <g stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke="#54324F">
                
                <!-- Left Brain (Organic) -->
                <path fill="#FDE68A" d="M32,5V59C22,59 14,51 14,41C14,31 20,27 20,21C20,15 15,9 25,5H32Z" />
                <path fill="none" d="M22,15 c 4,0 2,6 -1,5 M26,30 c -4,1 -2,6 1,5 M23,45 c 3,2 6,-2 3,-4"/>
                
                <!-- Right Brain (Digital) -->
                <path fill="#E58E57" d="M32,5V59C42,59 50,51 50,41C50,31 44,27 44,21C44,15 49,9 39,5H32Z"/>
                
                <!-- Circuit lines -->
                <path fill="none" d="M32,12 H 40 M32,21 H 44 M38,21 V 33 H 44 M32,40 H 42 V 50 H 35"/>
                
                <!-- Circuit nodes -->
                <g fill="#FDE68A" stroke="#54324F" stroke-width="1.5">
                  <circle cx="32" cy="12" r="2.5" />
                  <circle cx="40" cy="12" r="2.5" />
                  <circle cx="38" cy="21" r="2.5" />
                  <circle cx="44" cy="21" r="2.5" />
                  <circle cx="38" cy="33" r="2.5" />
                  <circle cx="44" cy="33" r="2.5" />
                  <circle cx="42" cy="40" r="2.5" />
                  <circle cx="42" cy="50" r="2.5" />
                  <circle cx="35" cy="50" r="2.5" />
                </g>
              </g>
            </svg>
            <h1 class="agent-title">AI AGENT</h1>
          </div>
          <p class="agent-description">PROCESS INPUT THROUGH GEMINI AI WITH MEMORY AND TOOLS</p>
        </div>
        <div class="connector-port out"></div>
        <div class="line-to-output"></div>
        <div class="output-node">
          <div class="plus-icon-wrapper" aria-label="Add step" role="button" tabindex="0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
               <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
               <path d="M12 5l0 14" />
               <path d="M5 12l14 0" />
            </svg>
          </div>
        </div>
      </div>
      
      <div class="bottom-nodes">
        <div class="node-item">
          <div class="icon-wrapper">
             <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-circuit-cell-plus" width="40" height="40" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M2 12h9" />
                <path d="M15 12h7" />
                <path d="M11 5v14" />
                <path d="M15 9v6" />
                <path d="M3 5h4" />
                <path d="M5 3v4" />
              </svg>
          </div>
          <span class="label">MODEL</span>
        </div>
        <div class="node-item">
          <div class="icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M12 6m-8 0a8 3 0 1 0 16 0a8 3 0 1 0 -16 0" />
              <path d="M4 6v6a8 3 0 0 0 16 0v-6" />
              <path d="M4 12v6a8 3 0 0 0 16 0v-6" />
            </svg>
          </div>
          <span class="label">MEMORY</span>
        </div>
        <div class="node-item">
          <div class="icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <path d="M3 21h4l13 -13a1.5 1.5 0 0 0 -2 -2l-13 13v4" />
              <path d="M14.5 5.5l4 4" />
              <path d="M12 8l-5 -5l-4 4l5 5" />
              <path d="M7 8l-1.5 1.5" />
              <path d="M16 14l-1.5 1.5" />
            </svg>
          </div>
          <span class="label">TOOLS</span>
        </div>
      </div>
    </main>
  `;
}
