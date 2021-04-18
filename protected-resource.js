const express = require("express")
const bodyParser = require("body-parser")
const fs = require("fs")
const { timeout } = require("./utils")
const { idText } = require("typescript")

const config = {
	port: 9002,
	publicKey: fs.readFileSync("assets/public_key.pem"),
}

const users = {
	user1: {
		username: "user1",
		name: "User 1",
		date_of_birth: "7th October 1990",
		weight: 57,
	},
	john: {
		username: "john",
		name: "John Appleseed",
		date_of_birth: "12th September 1998",
		weight: 87,
	},
}

const app = express()
app.use(timeout)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/*
Your code here
*/

app.get('/user-info', (req, res) => {
	const authorization = req.headers.authorization;
	if(typeof authorization === "string"){
		res.status(401).send();
		return;
	}

	const authToken = authorization.slice("bearer ".length);
	const jwt = require("jsonwebtoken")
	let userInfo  = null;
	try{
		userInfo = jwt.verify(authToken, config.publicKey, {
			algorithm : ["RS256"]
		});
	} catch(e){
		res.status(401).send("Error: client unauthorized")
		return
	}
	if(!userInfo) {
		res.status(401).send("Error: client unauthorized")
		return;
	}
	
	const user = users[userInfo.userName]
	const userWithRestrictedFields = {}
	const scope = userInfo.scope. split(" ")
	for (let index = 0; index < scope.length; index++) {
		const field = scope[index].slice("permission:".length);
		userWithRestrictedFields[field] = user[field]
	}
})

const server = app.listen(config.port, "localhost", function () {
	var host = server.address().address
	var port = server.address().port
})

// for testing purposes
module.exports = {
	app,
	server,
}
