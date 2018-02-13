var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var app = express();

//Webroot
app.get('/', function(req,res){
	res.setHeader('Content-Type', 'text/html');
	//res.sendStatus(200);
	res.send('<html><body><h1>Working</h1></body></html>');
})

app.get('/check/:regno/:transid/:bank', function(req,wres){
	
	var base = '/conference/ConferencePay.asmx/CONFONLINEPAYSTATUS?';
	var url = base + 'regno=' + req.params.regno + 
					 '&transid=' + req.params.transid + 
					 '&conference=' + process.env.DEPTCODE +'&confyear=' + process.env.CONFYEAR +
					 '&bankname=' + req.params.bank;

	var options = {
		host: process.env.HOST,
		port: 80,
		path: url
	}
	//res.redirect(url);
	var response_data= '';
	const http = require('http');
	var parseString = require('xml2js').parseString;
	var request = http.request(options, function(hres){
		var data = '';
		hres.on('data', function(chunk){
			data += chunk;
		});
		hres.on('end', function(){
			//console.log(data);
			parseString(data, function(err, res){
				var registration = res.DataTable['diffgr:diffgram'][0].DocumentElement[0].conferencepay[0].Registration[0];
				var amount = res.DataTable['diffgr:diffgram'][0].DocumentElement[0].conferencepay[0].Amount[0];
				var paystat = res.DataTable['diffgr:diffgram'][0].DocumentElement[0].conferencepay[0].Result[0];
				wres.setHeader('Content-Type', 'text/html');

	//res.sendStatus(200);
	var rendered_html = '<html><head>\n' +
						'<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">\n' +
						'</head><body>\n' +
						'<div class="container">\n' +
						'<h2>Registration Number: '+ registration +
						'<br><h2>Amount: '+ amount + 
						'</h2><br><h2>Status: '+ paystat +
						'</h2></div></body></html>'

	wres.send(rendered_html);
	//wres.send(path.join(__dirname,'index.html'));
				console.log(res.DataTable['diffgr:diffgram'][0].DocumentElement[0].conferencepay[0])
			})

		});
	});
	request.on('error', function(err){
		console.log(err.message);
	});
	request.end();
})
//Start the server

app.listen(3200, function() {
	console.log("started on PORT NO 3200");
})
