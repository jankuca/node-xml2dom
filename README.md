# node-xml2dom

This is a very simple XML parser for Node.js.

## Example

    var XMLParser = require('node-xml2dom');
    
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
    var document = parser.parseFromString(xml);

The resulting object follows the DOM specification. It, however, features only a subset of the most basic properties.

The output is an instance of `Document` and contains a hierarchy of `Element`, `Text` and `CDATASection` nodes according to the original structure in the XML input.

Note: Comment nodes are not featured in the output.

## Properties

            {number} Node::nodeType
           {?string} Node::tagName

                     Text < Node
            {string} Text::nodeValue

                     CDATASection < Node
            {string} CDATASection::nodeValue

                     Element < Node
            {Object} Element::attributes
      {Array.<Node>} Element::childNodes
    {Node|undefined} Element::firstChild
    {Node|undefined} Element::lastChild
