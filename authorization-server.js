const fs = require("fs")
const express = require("express")
const bodyParser = require("body-parser")
const jwt = require("jsonwebtoken")
const utils = require("./utils")
const {
	randomString,
	containsAll,
	decodeAuthCredentials,
	timeout,
} = require("./utils")

const config = {
	port: 9001,
	privateKey: fs.readFileSync("assets/private_key.pem"),

	clientId: "my-client",
	clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
	redirectUri: "http://localhost:9000/callback",

	authorizationEndpoint: "http://localhost:9001/authorize",
}

const clients = {
	"my-client": {
		name: "Sample Client",
		clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
		scopes: ["permission:name", "permission:date_of_birth"],
	},
	"test-client": {
		name: "Test Client",
		clientSecret: "TestSecret",
		scopes: ["permission:name"],
	},
}

const users = {
	user1: "password1",
	john: "appleseed",
}

const requests = {}
const authorizationCodes = {}

let state = ""

const app = express()
app.set("view engine", "ejs")
app.set("views", "assets/authorization-server")
app.use(timeout)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/*
Your code here
*/
app.get('/authorize', (req, res) => {
	const clientId = req.query.client_id;
	const client = clients[clientId];
	if(!client){
		res.status(401).send();
		return;
	}

	if(
		typeof req.query.scope !== "string" ||
		!utils.containsAll(client.scopes, req.query.scope.split(" "))
	){
		 res.statusCode(401).send("401 unauthorized");
		 return
	}

	const requestId = utils.randomString();
	requests[requestId] = req.query;

	res.render('login', {
		client,
		scope: req.query.scope,
		requestId,
	})
});

app.post('approve', (req, res) => {
	const { username, password, requestId } = req.body;

	if(!username ||  users[username] != password) {
		res.status(401).send("Error: user not authorized");
		return
	}
	const clientReq = requests[requestId];
	delete requests[requestId];
	if(!clientReq) {
		res.status(401).send("Error: Invalid user request");
		return;
	} 

	const authCode = randomString();
	authorizationCodes[authCode] = { clientReq, username };

	const redirectUri = url.parse(clientReq.redirectUri);
	redirectUri.query = {
		code,
		state: clientReq.state,
	}
	res.redirect(url.format(redirectUri));
});

app.post('/token', (req, res) => {
	let authCredentials = req.headers.authorization;
	if(!authCredentials){
		res.status(401).send();
		return;
	} 
	const {clientId, clientSecret} = utils.decodeAuthCredentials(rauthCredentials);

	const client = clients[clientId];
	if(!client || client.clientSecret != clientSecret){
		res.status(401).send();
		return;
	}
	const code = req.body.code;
	if(!code ||  authorizationCodes[code]){
		es.status(401).send();
		return 
	}
	const { clientReq, userName } = authorizationCodes[code];
	delete authorizationCodes[req.body.code];

	const username = obj.userName;
	const scope = obj.clientReq.scope;
	var privateKey = fs.readFileSync('/assets/private_key.pem');
	var token = jwt.sign(
		{ 
			username, 
			scope: clientReq.scope 
		}, 
		config.privateKey, 
		{ 
			algorithm: 'RS256',
			expiresIn: 300,
			issuer: "http://localhost:" + config.port,
		}
	);
	res.json(
		{
			access_token: token,
			token_type: "Bearer",
			scope: clientReq.scope
		}
	);
});

const server = app.listen(config.port, "localhost", function () {
	var host = server.address().address
	var port = server.address().port
})

// for testing purposes

module.exports = { app, requests, authorizationCodes, server }
