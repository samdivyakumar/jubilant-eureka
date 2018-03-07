## Checking pay status against payment gateway ##

### Set the following environment variables ###
- CONFYEAR
- DEPTCODE
- HOST=
- CONFYEAR=
- PAYSTATUS="/conference/ConferencePay.asmx/CONFONLINEPAYSTATUS"
- PAYSAVE="/conference/ConferencePay.asmx/CONFONLINEPAYSAVE"
- INSTNAME="Some Inst, Place, Country"
- BOOTSTRAP=https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css
- HOMEPAGE=

### Then run ###
```
npm install
node index.js
```

### App will be available on PORT 3200 ###
