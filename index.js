var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var path = require('path');
var https = require('https');
var fs = require('fs');
//var http = require('http');

// DDP

var DDPClient = require("ddp");

var ddpclient = new DDPClient({
	// All properties optional, defaults shown
	host: process.env.DDPHOST,
	port: process.env.DDPORT,
	ssl: false,
	autoReconnect: true,
	autoReconnectTimer: 500,
	maintainCollections: true,
	ddpVersion: '1', // ['1', 'pre2', 'pre1'] available
	// uses the SockJs protocol to create the connection
	// this still uses websockets, but allows to get the benefits
	// from projects like meteorhacks:cluster
	// (for load balancing and service discovery)
	// do not use `path` option when you are using useSockJs
	useSockJs: true
	// Use a full url instead of a set of `host`, `port` and `ssl`
	// do not set `useSockJs` option if `url` is used
	//url: 'wss://example.com/websocket'
});


var ddpdata = {};



app.use(bodyParser.urlencoded({
	extended: false
}));

app.use(bodyParser.json());

// Locals

app.locals.csslink = '<link href="' + process.env.BOOTSTRAP + '" rel="stylesheet">';
app.locals.port = process.env.SSHPORT;

app.get('/', function (req, res) {
	res.redirect(process.env.HOMEPAGE);
});

app.get('/css/bootstrap.min.css', function (req, res) {
	res.sendFile(path.join(__dirname + '/css/bootstrap.min.css'));
});

app.get('/check/:regno/:transid/:bank', function (req, wres) {

	var base = process.env.PAYSTATUS + '?';
	var url = base +
		'regno=' + req.params.regno +
		'&transid=' + req.params.transid +
		'&conference=' + process.env.DEPTCODE +
		'&confyear=' + process.env.CONFYEAR +
		'&bankname=' + req.params.bank;

	var options = {
		host: process.env.HOST,
		port: 80,
		path: url
	}
	//res.redirect(url);
	var response_data = '';
	const http = require('http');
	var parseString = require('xml2js').parseString;
	var request = http.request(options, function (hres) {
		var data = '';
		hres.on('data', function (chunk) {
			data += chunk;
		});
		hres.on('end', function () {
			//console.log(data);
			parseString(data, function (err, res) {
				var registration = res.DataTable['diffgr:diffgram'][0].DocumentElement[0].conferencepay[0].Registration[0];
				var amount = res.DataTable['diffgr:diffgram'][0].DocumentElement[0].conferencepay[0].Amount[0];
				var paystat = res.DataTable['diffgr:diffgram'][0].DocumentElement[0].conferencepay[0].Result[0];
				wres.setHeader('Content-Type', 'text/html');

				//res.sendStatus(200);
				var rendered_html = '<html><head>\n' +

					'<link rel="stylesheet" href="' +
					process.env.BOOTSTRAP +
					'">\n' +
					'</head><body>\n' +
					'<div class="container-fluid">\n' +
					'<div class="panel panel-primary">\n' +
					'<div class="panel-heading">\n' +
					'<div class="panel-title"><h1>' + process.env.INSTNAME + 
					'</h1></div></div>\n' +
					'<div class="panel-header"><center><h3>Payment Status Check</h3></center></div>\n' +
					'<div class="panel-body">\n' +
					'<div class="table-responsive">\n' +
					'<table class="table table-bordered">\n' +
					'<tbody>\n' +
					'<tr>\n<td><b> Registration Number: </b></td>' +
					'<td>' + registration + '</td></tr>\n' +
					'<tr>\n<td><b> Amount: </b></td>' +
					'<td>' + amount + '</td></tr>\n' +
					'<tr>\n<td><b> Status: </b></td>' +
					'<td>' + paystat + '</td></tr>\n' +
					'</tbody></table>\n' +
					'</div><div class="panel-footer"><center><h4>If the status is NOT PROCESSED, Please wait for 24 hours to confirm the payment</h4></center></div></div></div></div></body>\n' +

					'</html>'

				wres.send(rendered_html);
				//wres.send(path.join(__dirname,'index.html'));
				console.log(res.DataTable['diffgr:diffgram'][0].DocumentElement[0].conferencepay[0])
			})

		});
	});
	request.on('error', function (err) {
		console.log(err.message);
	});
	request.end();
});

app.post('/hook', function (req, res) {
	console.log('Hook');
	if (req.body) {
		res.sendStatus(200);
		console.log(req.body);
		/*ddpdata.CandidateName = req.body.CandidateName;
		ddpdata.Course = req.body.Course;
		ddpdata.TotalAmount = req.body.TotalAmount;
		ddpdata.PayMode = req.body.PayMode; */
		ddpdata = req.body;
		var tmpregno = req.body.Sregno;
		if (ddpdata) {
			if (ddpdata.sregno) {
				ddpdata.sregno = tmpregno.replace(".", "_");
			}
			delete ddpdata['$etag'];
			delete ddpdata['$version'];
			callDDP('addTransaction', [ddpdata]);
		}
	}
});

app.get('/calc.html', function (req, res) {
	res.sendFile(path.join(__dirname + '/calc.html'));
});

app.get('/calc1.html', function (req, res) {
	res.setHeader('Content-Type', 'text/html');
	res.send('<html><head>' +
		app.locals.csslink +
		'</head><body>' +
		'<div class="container"><h1>' +
		req.query.coursename +
		'</h1>' +
		'</div></body></html>');
	res.end();
	return;
	var ahtml = ""
	console.log(req.query);

});

app.get('/confirmation.html', function (req, res) {
	console.log(req.query.paytranid);
	if ((req.query.paytranid) && (req.query.paytranid != "undefined")) {
		//res.redirect('/confdetails/' + req.query.paytranid);
		res.setHeader('Content-Type', 'text/html');
		res.send('<html><head>' +
			app.locals.csslink +
			'</head><body>' +
			'<div class="container">' +

			'<h2>Your transaction ID is ' + req.query.paytranid + '.</h2>' +
			'<h3>Please save for your reference</h3>' +
			'</div></body></html>');
		res.end();
		return;

	} else {
		res.setHeader('Content-Type', 'text/html');
		res.send('<html><head>' +
			app.locals.csslink +
			'</head><body>' +
			'<div class="container">' +

			'<h2>Not a valid transaction ID OR cancelled payment.</h2>' +
			'</div></body></html>');
		res.end();
		return;
	}
});

app.get('/confdetails/:transid', function (req, res) {
	console.log(';' + req.params.transid + ':');
	var regno = "";
	var rregno = [];
	var realregno = callDDP('getRegno', [req.params.transid]);
	if (realregno) {
		paymentmode = 'BANKNAME';

	} else {

		res.setHeader('Content-Type', 'text/html');
		res.send('<html><head>' +
			app.locals.csslink +
			'</head><body>' +
			'<div class="container">' +

			'<h2>Not a valid transaction ID</h2>' +
			'</div></body></html>');
		res.end();
		return;
	}
	console.log(realregno);

	var path = process.env.PAYSTATUS +
		'?regno=' + realregno +
		'&transid=' + req.params.transid +
		'&conference=' + process.env.DEPTCODE +
		'&confyear=' + process.env.CONFYEAR +
		'&bankname=' + paymentmode;

	var options = {
		host: process.env.HOST,
		port: 80,
		path: path
	};

	path = encodeURIComponent(path);
	console.log(path);

	var response_data = "";
	const http = require('http');
	var parseString = require('xml2js').parseString;

	var request = http.request(options, function (hres) {
		var data = '';

		hres.on('data', function (chunk) {
			data += chunk;
		});
		hres.on('end', function () {
			console.log(data);
			var send_data = "";
			var rdata = send_data.replace(/(http:\/\/clin.*Refreg=\d+[-]?\D+[-]?\d+)/, "<![CDATA[$1]]>");
			GetURL(rdata, function (r_url) {
				send_data = r_url;
			});

			console.log('transid : ' + req.params.transid);

			if (req.params.transid) {
				res.setHeader('Content-Type', 'text/html');
				res.send('<html><head>' +
					app.locals.csslink +
					'</head><body>' +
					'<div class="container">' +

					'<p class=lead><br/></p><table class="lead table"><tr class="lead"><td>Registration: </td><td>' + send_data.Registration + '</td></tr>\n' +
					'<tr class="lead"><td>Trans ID:</td><td> ' + send_data.Transid + '</td></tr>\n' +
					'<tr class="lead"><td>Result :</td><td>' + send_data.Result +
					'</td></tr></table></div></body></html>');

			} else {
				res.setHeader('Content-Type', 'text/html');
				res.send('<html><head>' +
					app.locals.csslink +
					'</head><body>' +
					'<div class="container">' +
					'<h2>Failed : Not valid a transaction ID OR cancelled payment.</h2>' +
					'</div></body></html>');
			}

		});
	});

	request.on('error', function (e) {
		console.log(e.message);
	});

	request.end();

	function GetURL(data, cb) {
		parseString(data, function (err, result) {
			var url = result.DataTable['diffgr:diffgram'][0].DocumentElement[0].conferencepay[0].URL[0];
			var nurl = url.replace(/\n/g, '');
			var nurl = url.replace(/\&amp\;/g, '&');
			cb(nurl);
		});
	}

	//res.send(path);
});

app.get('/pay', function (req, res) {

	var tmpregno = req.query.regno;
	var rregno = tmpregno.replace(".", "_");

	var path = process.env.PAYSAVE +
		'?regno=' +
		encodeURIComponent(rregno) +
		'&cname=' +
		encodeURIComponent(req.query.cname) +
		'&address=%22%22&address1=%22%22&city=%22%22&state=%22%22&pincode=%22%22&phone=%22%22&mobile=%22%22&email=%22%22&foodtype=%22%22&participanttype=%22%22&practicetype=%22%22&members=%22%22' +
		'&totalregfee=' + encodeURIComponent(req.query.totalregfee) +
		'&conference=' + process.env.DEPTCODE + '&confyear=' + process.env.CONFYEAR + '&bankname=' + encodeURIComponent(req.query.paymentmode) + '&remoteip=%22%22';

	var options = {
		host: process.env.HOST,
		port: 80,
		path: path
	}

	console.log(path);

	var response_data = "";
	const http = require('http');
	var parseString = require('xml2js').parseString;

	var url = "";
	var vals = [];
	var ddpdata = {};
	http.get(options, function (hres) {
		console.log("Got response: " + hres.statusCode);

		hres.on("data", function (chunk) {
			response_data = chunk;
			var rndata = response_data.toString();
			var rdata = rndata.replace(/(http:\/\/clin.*Refreg=\d+[-]?\D+[-]?\d+)/, "<![CDATA[$1]]>");
			GetURL(rdata, function (r_url) {
				url = r_url;
			});
			var nurl = url.replace(/\&amp\;/g, '&');
			console.log('url: ' + nurl);
			//vals = url.match(/.*paytranid=(\d+)&Refreg=(\d+).*/);        
			//vals = url.match(/.*paytranid=(\d+)&Refreg=(\d+-\D+-\d+)$/);
			//vals = url.match(/.*paytranid=(\d+)&Refreg=(\D?\d+[-]?\D+[-]?\d+)$/);
			// For the O (oh) that shows up in paytranid
			vals = nurl.match(/.*paytranid=(\d+[\D]?\d+)&Refreg=(\D?\d+[-]?\D+[-]?\d+)$/);
			console.log("url:" + nurl);
			console.log("vals:" + vals[1] + "\t" + vals[2]);
			if (vals) {
				ddpdata.transid = vals[1];
				ddpdata.sregno = vals[2];
				console.log(ddpdata.sregno);
				callDDP('addTransaction', [ddpdata]);
			}
			res.redirect(nurl);
		});

	}).on('error', function (e) {
		console.log("Got error: " + e.message);
	}).on('end', function () {
		console.log('end: ' + nurl);
	});

	/*
	  var data = '<html><head>' +
	    app.locals.csslink +
	    '</head><body>' +
	    '<div class="container">' +
	    '<h2> Name : ' + req.query.cname + '</h2>' +
	    '<h2> Total Registration Fee : ' + req.query.totalregfee + '</h2></br>' +
	    '<a href="http://pay.cmcdistedu.org/proceed/' + req.query.regno + '">' +
	    '<button class=\"btn btn-info\">Submit for payment</button></a>' +
	    '</div></body></html>';

	  res.writeHead(200, {
	    'Content-Type': 'text/html',
	    'Content-Length': data.length
	  });
	  res.end(data);
	*/



	function GetURL(data, cb) {
		parseString(data, function (err, result) {
			var url = result.DataTable['diffgr:diffgram'][0].DocumentElement[0].conferencepay[0].URL[0];
			var nurl = url.replace(/\n/g, '');
			cb(nurl);
		});
	}

})

app.get('/npay', function (req, res) {

	var tmpregno = req.query.regno;
	var rregno = tmpregno.replace(".", "_");

	var path = process.env.PAYSAVE +
		'?regno=' +
		encodeURIComponent(rregno) +
		'&cname=' +
		encodeURIComponent(req.query.cname) +
		'&address=%22%22&address1=%22%22&city=%22%22&state=%22%22&pincode=%22%22&phone=%22%22&mobile=%22%22&email=%22%22&foodtype=%22%22&participanttype=%22%22&practicetype=%22%22&members=%22%22' +
		'&totalregfee=' + encodeURIComponent(req.query.totalregfee) +
		'&conference=CMCAS2018&confyear=2017&bankname=' + encodeURIComponent(req.query.paymentmode) + '&remoteip=%22%22';

	var options = {
		host: process.env.HOST,
		port: 80,
		path: path
	}

	console.log(path);

	var response_data = "";
	const http = require('http');
	var parseString = require('xml2js').parseString;

	var url = "";
	var vals = [];
	var ddpdata = {};
	http.get(options, function (hres) {
		console.log("Got response: " + hres.statusCode);

		hres.on("data", function (chunk) {
			response_data = chunk;
			var rndata = response_data.toString();
			var rdata = rndata.replace(/(http:\/\/clin.*Refreg=\d+[-]?\D+[-]?\d+)/, "<![CDATA[$1]]>");
			nGetURL(rdata, function (r_url) {
				url = r_url;
			});
			var nurl = url.replace(/\&amp\;/g, '&');
			console.log('url: ' + nurl);
			//vals = url.match(/.*paytranid=(\d+)&Refreg=(\d+).*/);        
			vals = nurl.match(/.*paytranid=(\d+[\D]?\d+)&Refreg=(\D?\d+[-]?\D+[-]?\d+)$/);
			//vals = nurl.match(/.*paytranid=(\d+)&Refreg=(\d+[-]?\D+[-]?\d+)$/);
			console.log(vals);
			if (vals) {
				ddpdata.transid = vals[1];
				ddpdata.sregno = vals[2];
				console.log(ddpdata.sregno);
				callDDP('addTransaction', [ddpdata]);
			}
			res.redirect(nurl);
		});

	}).on('error', function (e) {
		console.log("Got error: " + e.message);
	}).on('end', function () {
		console.log('end: ' + nurl);
	});

	function nGetURL(data, cb) {
		parseString(data, function (err, result) {
			var url = result.DataTable['diffgr:diffgram'][0].DocumentElement[0].conferencepay[0].URL[0];
			var nurl = url.replace(/\n/g, '');
			cb(nurl);
		});
	}

})

app.get('/nconfirmation.html', function (req, res) {
	console.log('paytranid');
	console.log(req.query.paytranid);
	console.log('transid');
	console.log(req.query.transid);
	console.log('message');
	console.log(req.query.message);
	//if ((req.query.paytranid) && (req.query.paytranid != "undefined")) {
	if ((req.query.transid) && (req.query.transid != "undefined")) {
		//res.redirect('/confdetails/' + req.query.paytranid);
		res.setHeader('Content-Type', 'text/html');
		res.send('<html><head>' +
			app.locals.csslink +
			'</head><body>' +
			'<div class="container">' +
			'<h2>CMC Annual Symposium 2018' +
			'<h2>Your transaction ID is ' + req.query.transid + '.</h2>' +
			'<h3>' + req.query.message + '</h3>' +
			'<h3>Please save for your reference</h3>' +
			'<h3>Click the link to return to <a href="http://www.cmcannualsymposium.com/">CMC Symposium page</a></h3>' +
			'</div></body></html>');
		res.end();
		return;

	} else {
		res.setHeader('Content-Type', 'text/html');
		res.send('<html><head>' +
			app.locals.csslink +
			'</head><body>' +
			'<div class="container">' +
			'<h2>CMC Annual Symposium 2018' +
			'<h2>Not a valid transaction ID OR cancelled payment.</h2>' +
			'</div></body></html>');
		res.end();
		return;
	}
});


function callDDP(methodname, parameters) {
	ddpclient.connect(function (error, wasReconnect) {
		// If autoReconnect is true, this callback will be invoked each time
		// a server connection is re-established
		if (error) {
			console.log('DDP connection error!');
			return;
		}

		if (wasReconnect) {
			console.log('Reestablishment of a connection.');
		}

		console.log('connected!');

		console.log(methodname, parameters);

		setTimeout(function () {
			/*
			 * Call a Meteor Method
			 */
			ddpclient.call(
				methodname, // name of Meteor Method being called
				parameters, // parameters to send to Meteor Method
				function (err, result) { // callback which returns the method call results
					console.log('called method' + methodname + ' result: ' + result);
				},
				function () { // callback which fires when server has finished
					console.log('updated'); // sending any updated documents as a result of
					//console.log(ddpclient.collections.posts);  // calling this method
					ddpclient.close();
				}
			);
		}, 3000);
	});
}


// Redirect from http port 80 to https
var http = require('http');
http.createServer(function (req, res) {
	res.writeHead(301, {
		"Location": "https://" + req.headers['host'] + req.url
	});
	res.end();
}).listen(80);


// app.listen(app.locals.port, function() {
//   console.log("Started on PORT " + app.locals.port);
// })


// var privateKey = fs.readFileSync( 'privatekey.pem' );
// var certificate = fs.readFileSync( 'certificate.pem' );

var options = {
	key: fs.readFileSync('./' + process.env.KEY),
	cert: fs.readFileSync('./' + process.env.CERT),
	ca: [fs.readFileSync('./' + process.env.CA1), fs.readFileSync('./' + process.env.CA2), fs.readFileSync('./' + process.env.CA3)]
}
https.createServer(options, app).listen(app.locals.port, function () {
	console.log("Started on PORT " + app.locals.port);
});
