# NoteMaker
This a note making and sending app build  using express , mongodb and nodejs , allowing an user to create and send notes to a particular person on his/her email id. 


Pre Requisites :
1. Make sure that you have mongodb Installed on your system and congfigured it properly by setting up the command line environment path. You can download it from https://www.mongodb.com/download-center/community .
2. Allow / Enable less secure apps access to your gmail account by going through your gmail account settings. You can do it directly from https://myaccount.google.com/lesssecureapps .

Steps To Run :
1. Clone the repository .
2. Go to users.js file in routes folder and edit it to set up your gmail smtp settings by providing your gmail id and gmail account password .
3. Open a command prompt and run mongodb by typing mongod.
4. Run the server by typing npm start.
5. In your browser , run the app on port 5000 by typing http://localhost:5000 .
