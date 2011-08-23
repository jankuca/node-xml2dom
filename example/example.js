var XMLParser = require('../src/xmlparser');

var xml = '<?xml version="1.0"?>\
<!DOCTYPE html>\
<root list="ESR23">\
	<abc>Abcd def\
		<def ghi="jkl">Efg</def>\
		<mno />\
		<![CDATA[asd]]>\
	</abc>\
	<p />\
</root>\
';

var parser = new XMLParser();
console.log(
	JSON.stringify(parser.parseFromString(xml))
);
