(function(window){"use strict";/*!
 * 
 * 	elfsight.com
 * 
 * 	Copyright (c) 2020 Elfsight, LLC. ALL RIGHTS RESERVED
 * 
 */
!function(t){var e={};function r(o){if(e[o])return e[o].exports;var a=e[o]={i:o,l:!1,exports:{}};return t[o].call(a.exports,a,a.exports,r),a.l=!0,a.exports}r.m=t,r.c=e,r.d=function(t,e,o){r.o(t,e)||Object.defineProperty(t,e,{configurable:!1,enumerable:!0,get:o})},r.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return r.d(e,"a",e),e},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r.p="",r(r.s=0)}([function(t,e){(window.eapps=window.eapps||{}).observer=function(t){t.$watch("widget.data.layout",function(){t.setPropertyVisibility("layoutSlider","slider"===t.widget.data.layout)}),t.$watch("widget.data.template",function(){var e="tiledBalloon"===t.widget.data.template||"tiledPostcard"===t.widget.data.template||"singlePostcard"===t.widget.data.template;t.setPropertyVisibility("backgroundColor",e)})}}]);})(window)