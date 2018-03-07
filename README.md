## Checking pay status against payment gateway ##

### Set the following environment variables ###
| Variable	| Explanation								|
|---------------|-----------------------------------------------------------------------| 
|- CONFYEAR 	| # Provided by payment gateway provider				|
|- DEPTCODE	| # Conference code - also provided by provider				|
|- CONFYEAR	| # Conference year							|
|- HOST		| # Host on which payment gateway software runs				|
|- PAYSTATUS	| "/conference/ConferencePay.asmx/CONFONLINEPAYSTATUS"			|
|- PAYSAVE	| "/conference/ConferencePay.asmx/CONFONLINEPAYSAVE"			|
|- INSTNAME	| Institution name - "Some Inst, Place, Country"			|
|- BOOTSTRAP	| https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css	|
|- HOMEPAGE	| http://some_nst.org							|
|---------------|-----------------------------------------------------------------------|
####If using SSL
- CA1
- CA2
- CA3
- CERT
- KEY
- SSHPORT

####If using DDP
- DDPHOST
- DDPORT

### Then run ###
```
npm install
node index.js
```

### App will be available on PORT 3200 ###
