var sys = require('sys');
var EventEmitter = require('events').EventEmitter;


function XMLParser() {
	EventEmitter.call(this);
};
module.exports = XMLParser;
sys.inherits(XMLParser, EventEmitter);

XMLParser.prototype.parseFromString = function (xml) {
	xml = xml.replace(/^\s+/g, '');
	xml = xml.replace(/\s+$/g, '');
	xml = xml.replace(/\s+/g, ' ');
	xml = xml.replace(/\n+/g, ' ')
	xml = xml.replace(/\s+$/g, '');

	var xmldef = xml.match(/^<\?xml[^>]+\?>\s*/);
	if (xmldef) {
		xml = xml.substr(xmldef[0].length);
	}

	var doctype = xml.match(/^<!DOCTYPE [^>]+>/i);
	if (doctype) {
		xml = xml.substr(doctype[0].length);
	}

	if (!xml) throw new Error('Missing root element');

	return this.parseNodeString_(xml);
};

XMLParser.prototype.parseNodeString_ = function (xml) {
	var node = new Document();
	var open = [node];
	var in_start_tag = false;
	var in_closing_tag = false;

	while (xml) {
		switch (xml[0]) {
			case '<': // tag start
				var cdata = xml.match(/^<!\[CDATA\[/);
				var comment = xml.match(/^<!--.*?-->/);
				if (cdata) { // CDATA
					xml = xml.substr(cdata[0].length);
					node = new CDATASection();
					if (xml.substr(0, 3) === ']]>') {
						node.nodeValue = '';
						xml = xml.substr(3);
					} else {
						var data = xml.match(/(.*[^\\])]]>/);
						node.nodeValue = data[1];
						xml = xml.substr(data[0].length);
					}
					open[open.length - 1].childNodes.push(node);
				} else if (comment) { // comment
					xml = xml.substr(comment[0].length);
				} else { // element
					var tagName = xml.match(/^<\/?([\w:]+)/);
					if (xml[1] !== '/') { // opening
						node = new Element();
						node.tagName = tagName[1];
						open[open.length - 1].childNodes.push(node);
						open.push(node);
						in_start_tag = true;
					} else { // closing
						in_closing_tag = true;
						var last_open = open.pop();
						if (last_open.tagName !== tagName[1]) {
							throw new Error('Parse error, closing tag mismatch');
						}
						last_open.firstChild = last_open.childNodes[0];
						last_open.lastChild = last_open.childNodes[last_open.childNodes.length - 1];
					}
					xml = xml.substr(tagName[0].length);
				}
				break;

			case '>': // tag end
				if (in_start_tag) { // opening tag end
					in_start_tag = false;
					xml = xml.substr(1);
				} else if (in_closing_tag) { // closing tag end
					in_closing_tag = false;
					xml = xml.substr(1);
				} else {
					throw new Error('Parse error, ">" should be a "&gt;" HTML entity');
				}
				break;

			case ' ':
				if (in_start_tag) {
					// look for attributes
					var attr;
					while (attr = xml.match(/^(?:\s([\w:]+))/)) {
						xml = xml.substr(attr[0].length);
						if (xml[0] === '=') { // has value
							var quote_type = xml[1];
							if (quote_type === '"' && quote_type === "'") {
								throw new Error('Parse error, missing attribute quotes');
							}
							if (xml[2] === quote_type) { // empty value
								node.attributes[attr[1]] = '';
							} else { // non-empty value
								var value = xml.match(
									new RegExp('^=' + quote_type + '(.*?[^\\\\])' + quote_type));
								if (value === null) {
									throw new Error('Parse error, invalid attribute value');
								}
								node.attributes[attr[1]] = value[1];
								xml = xml.substr(value[0].length).replace(/^\s+/, '');
							}
						} else {
							node.attributes[attr[1]] = true;
						}
					}
				}
				xml = xml.substr(1);
				break;

			case '/': // self-closing tag end
				if (in_start_tag) {
					open.pop();
				}
				xml = xml.substr(1);
				break;

			default:
				var data = xml.match(/^(.+?)</);
				node = new Text();
				node.data = data[1];
				open[open.length - 1].childNodes.push(node);
				xml = xml.substr(data[0].length - 1);
		}
	}

	return /** @type {Document} */ open[0];
};


function Node() {
	this.tagName = null;
	this.nodeType = 0;
};

Node.prototype.ELEMENT_NODE = 1;
Node.prototype.TEXT_NODE = 3;
Node.prototype.CDATA_SECTION_NODE = 4;
Node.prototype.DOCUMENT_NODE = 9;

function Text() {
	Node.call(this);

	this.nodeType = 3;
	this.nodeValue = '';
};
sys.inherits(Text, Node);

function CDATASection() {
	Node.call(this);

	this.nodeType = 4;
	this.nodeValue = '';
};
sys.inherits(CDATASection, Node);

function Element() {
	Node.call(this);

	this.attributes = {};
	this.childNodes = [];
	this.firstChild = undefined;
	this.lastChild = undefined;
	this.nodeType = 1;
};
sys.inherits(Element, Node);

Element.prototype.getAttribute = function (key) {
	return this.attributes[key];
};

function Document() {
	Element.call(this);

	this.nodeType = 9;
};
sys.inherits(Document, Element);
