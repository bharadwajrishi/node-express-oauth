const fs = require("fs")
const express = require("express")
const bodyParser = require("body-parser")
const jwt = require("jsonwebtoken")
const utils = require("utils")
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
	const client = clients.find(c => c == req.params.client_id);
	if(client == 'undefined'){
		return res.status(401).send();
	}
	const currentScopes = req.query.scope.split(" ")
	const hasScope = utils.containsAll(client.scopes, currentScopes);
	if(!hasScope) return res.statusCode(401).send();

	const key = utils.randomString();
	const value = req.query;

	const requestId = [];
	requestId.push({
		key: value
	});

	var params = [];
	params.push(
		{ 'client': client  },
		{ 'scope': req.query.scope },
		{ 'requestId':  requestId });
	res.render('login', )
	res.status(200).send();
	res.end();
});

app.post('approve', (req, res) => {
	const currentUserName = req.body['username'];
	const currentPassword = req.body['password'];

	const currentUser = users.find(u => u == currentUserName);
	if(!currentUser ||  users[currentUser] != currentPassword) 
		return res.status(401).send();

	const request = requests[req.body.requestId];
	if(!request) return res.status(401).send();

	const authCodeValue = {
		'clientReq': request,
		'userName': currentUserName,
	};

	const authCode = utils.randomString();
	authorizationCodes.push({
		authCode : authCodeValue
	});

	res.redirect(request.redirectUri +'?code=' + authCode + '&state=' + request.state);
});

app.post('/token', (req, res) => {
	if(!req.headers.authorization) return res.status(401).send();
	const decodedAuthCode = utils.decodeAuthCredentials(req.headers.authorization);

	const client = clients.find(c => c == decodedAuthCode.clientId);
	if(!client || client.clientSecret != decodedAuthCode.clientSecret)
		return res.status(401).send();
	
	const obj = authorizationCodes[req.body.code];
	if(obj == 'undefined'){
		res.status(401).send();
	}else{
		delete authorizationCodes[req.body.code];
	}

	const userName = obj.userName;
	const scope = obj.clientReq.scope;
	var privateKey = fs.readFileSync('/assets/private_key.pem');
	var token = jwt.sign({ userName : scope }, privateKey, { algorithm: 'RS256' });
	res.status(201).json(
		{ "access_token" : token },
		{ "token_type" : 'Bearer' },
	);
});

const server = app.listen(config.port, "localhost", function () {
	var host = server.address().address
	var port = server.address().port
})

// for testing purposes

module.exports = { app, requests, authorizationCodes, server }
