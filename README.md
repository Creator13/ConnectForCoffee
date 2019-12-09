# Installation
    cd server
    npm install
    cd ../whoisit
    npm install

 # Dev'ing
Server

    cd server
    npm run serve

!!!! When visiting the server, it server the front-end from the build folder. So only after deploying the front-end, the changes will be visible in files served by the server. For deving, it's easier to use the built-in dev server in the front-end:

 Front-End

    cd whoisit
    npm run serve
    
# Deploying
 Front-End

    cd whoisit
    npm run build

 Server
    idk yet