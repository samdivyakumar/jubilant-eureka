var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var app = express();

//Webroot
app.get('/', function(req, res) {
	res.setHeader('Content-Type', 'text/html');
	//res.sendStatus(200);
	res.send('<html><body><h1>Working</h1></body></html>');
})

app.get('/check/:regno/:transid/:bank', function(req, wres) {

	var base = '/conference/ConferencePay.asmx/CONFONLINEPAYSTATUS?';
	var url = base + 'regno=' + req.params.regno +
		'&transid=' + req.params.transid +
		'&conference=' + process.env.DEPTCODE + '&confyear=' + process.env.CONFYEAR +
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
	var request = http.request(options, function(hres) {
		var data = '';
		hres.on('data', function(chunk) {
			data += chunk;
		});
		hres.on('end', function() {
			//console.log(data);
			parseString(data, function(err, res) {
				var registration = res.DataTable['diffgr:diffgram'][0].DocumentElement[0].conferencepay[0].Registration[0];
				var amount = res.DataTable['diffgr:diffgram'][0].DocumentElement[0].conferencepay[0].Amount[0];
				var paystat = res.DataTable['diffgr:diffgram'][0].DocumentElement[0].conferencepay[0].Result[0];
				wres.setHeader('Content-Type', 'text/html');

				//res.sendStatus(200);
				var rendered_html = '<html><head>\n' +

					'<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">\n' +
					'</head><body>\n' +
					'<div class="container-fluid">\n' +
					'<div class="panel panel-primary">\n' +
					'<div class="panel-heading">\n' +
					'<div class="panel-title"><h1>Distance Education, CMC Vellore.</h1></div></div>\n' +
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
	request.on('error', function(err) {
		console.log(err.message);
	});
	request.end();
})
//Start the server

app.listen(3200, function() {
	console.log("started on PORT NO 3200");
})