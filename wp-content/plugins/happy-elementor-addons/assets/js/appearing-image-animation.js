"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
(function ($, w) {
  "use strict";

  $(w).on("elementor/frontend/init", function () {
    if (typeof gsap === "undefined") return;
    if (typeof ScrollTrigger === "undefined") {
      console.warn("ScrollTrigger not loaded");
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    var HappyAIA = elementorModules.frontend.handlers.Base.extend({
      scrollTriggers: [],
      timelines: [],
      onInit: function onInit() {
        elementorModules.frontend.handlers.Base.prototype.onInit.apply(this, arguments);
        this.build();
      },
      onElementChange: function onElementChange() {
        this.destroyAnimation();
        this.build();
      },
      onDestroy: function onDestroy() {
        this.destroyAnimation();
        elementorModules.frontend.handlers.Base.prototype.onDestroy.apply(this, arguments);
      },
      destroyAnimation: function destroyAnimation() {
        this.scrollTriggers.forEach(function (st) {
          return st && st.kill && st.kill();
        });
        this.timelines.forEach(function (tl) {
          return tl && tl.kill && tl.kill();
        });
        this.scrollTriggers = [];
        this.timelines = [];
        this.$element.find(".ha-aia-slice").remove();
        this.$element.removeClass("ha-aia-animating ha-aia-complete");

        // RESET
        var container = this.$element[0];
        var image = this.$element.find("img")[0];
        if (container) {
          gsap.set(container, {
            clearProps: "clipPath,overflow,transition"
          });
        }
        if (image) {
          gsap.set(image, {
            clearProps: "all",
            opacity: 1
          });
          var wrap = image.parentElement;
          if (wrap) {
            gsap.set(wrap, {
              clearProps: "transition,paddingBottom"
            });
          }
        }
      },
      build: function build() {
        var settings = this.getElementSettings();
        if (settings.ha_aia_switcher !== "yes") return;
        if ('mobile' === elementorFrontend.getCurrentDeviceMode() && settings.ha_aia_enable_on_mobile !== 'yes') {
          gsap.set(this.$element[0], {
            autoAlpha: 1
          });
          return;
        }
        var $container = this.$element;
        var $image = $container.find("img").first();
        if (!$image.length) return;
        var config = this.getConfig(settings);
        this.applyAnimation($container[0], $image[0], config);
      },
      getResponsiveSetting: function getResponsiveSetting(settings, key, respectEmpty) {
        var deviceMode = elementorFrontend.getCurrentDeviceMode();
        if (deviceMode !== 'desktop') {
          var deviceKey = key + '_' + deviceMode;
          if (settings[deviceKey] !== undefined && (respectEmpty || settings[deviceKey] !== '')) {
            return settings[deviceKey];
          }
        }
        return settings[key];
      },
      getConfig: function getConfig(settings) {
        return {
          mode: this.getResponsiveSetting(settings, 'ha_aia_mode') || 'reveal',
          direction: this.getResponsiveSetting(settings, 'ha_aia_rs_direction') || 'left',
          cornerDirection: this.getResponsiveSetting(settings, 'ha_aia_corner_direction') || 'top-left',
          scaleFrom: parseFloat(this.getResponsiveSetting(settings, 'ha_aia_scale_from')) || 0,
          scaleTo: parseFloat(this.getResponsiveSetting(settings, 'ha_aia_scale_to')) || 1,
          duration: parseFloat(this.getResponsiveSetting(settings, 'ha_aia_animation_duration')) || 1,
          delay: parseFloat(this.getResponsiveSetting(settings, 'ha_aia_delay')) || 0,
          easing: this.getResponsiveSetting(settings, 'ha_aia_easing_function') || 'power2.out',
          trigger: (this.getResponsiveSetting(settings, 'ha_aia_trigger_point') || 'top-center').replace('-', ' '),
          tiles: parseInt(this.getResponsiveSetting(settings, 'ha_aia_tiles_count')) || 5,
          tilesOrientation: this.getResponsiveSetting(settings, 'ha_aia_tiles_orientation') || 'horizontal',
          tilesHorizontalDirection: this.getResponsiveSetting(settings, 'ha_aia_tiles_horizontal_direction') || 'bottom-to-top',
          tilesVerticalDirection: this.getResponsiveSetting(settings, 'ha_aia_tiles_vertical_direction') || 'left-to-right',
          tilesStaggerDelay: this.getResponsiveSetting(settings, 'ha_aia_tiles_stagger_delay') || 0.08
        };
      },
      getClipPath: function getClipPath(direction) {
        return {
          left: "inset(0 0 0 100%)",
          right: "inset(0 100% 0 0)",
          top: "inset(0 0 100% 0)",
          bottom: "inset(100% 0 0 0)"
        }[direction];
      },
      getCornerClipPath: function getCornerClipPath(direction) {
        return {
          "top-left": "inset(0 100% 100% 0)",
          "top-right": "inset(0 0 100% 100%)",
          "bottom-left": "inset(100% 100% 0 0)",
          "bottom-right": "inset(100% 0 0 100%)",
          "center": "inset(50% 50% 50% 50%)"
        }[direction];
      },
      getTransformOrigin: function getTransformOrigin(direction) {
        return {
          left: "left center",
          right: "right center",
          top: "center top",
          bottom: "center bottom"
        }[direction];
      },
      createTiles: function createTiles(container, image, config) {
        var rect = container.getBoundingClientRect();
        var slices = [];
        var count = config.tiles;
        var orientation = config.tilesOrientation;
        var direction = orientation === 'horizontal' ? config.tilesHorizontalDirection : config.tilesVerticalDirection;
        container.style.position = "relative";
        container.style.overflow = "hidden";
        var axis, origin;
        switch (direction) {
          case "left-to-right":
            axis = "scaleX";
            origin = "left center";
            break;
          case "right-to-left":
            axis = "scaleX";
            origin = "right center";
            break;
          case "top-to-bottom":
            axis = "scaleY";
            origin = "center top";
            break;
          case "bottom-to-top":
            axis = "scaleY";
            origin = "center bottom";
            break;
          default:
            axis = "scaleY";
            origin = "center top";
        }
        if (orientation === "horizontal") {
          var totalWidth = Math.round(rect.width);
          var sliceWidth = Math.ceil(totalWidth / count); // avoid fractions

          for (var i = 0; i < count; i++) {
            var left = i * sliceWidth;
            var slice = document.createElement("div");
            slice.classList.add("ha-aia-slice");
            Object.assign(slice.style, {
              position: "absolute",
              top: "0px",
              left: left + "px",
              width: sliceWidth + 0.4 + "px",
              // adjust overlap
              height: Math.round(rect.height) + "px",
              backgroundImage: "url(".concat(image.src, ")"),
              backgroundSize: totalWidth + "px " + Math.round(rect.height) + "px",
              backgroundPosition: "-".concat(left, "px 0px"),
              backgroundRepeat: "no-repeat",
              transformOrigin: origin,
              backfaceVisibility: "hidden",
              willChange: "transform"
            });
            container.appendChild(slice);
            slices.push(slice);
          }
        } else {
          var totalHeight = Math.round(rect.height);
          var sliceHeight = Math.ceil(totalHeight / count);
          for (var _i = 0; _i < count; _i++) {
            var top = _i * sliceHeight;
            var _slice = document.createElement("div");
            _slice.classList.add("ha-aia-slice");
            Object.assign(_slice.style, {
              position: "absolute",
              top: top + "px",
              left: "0px",
              width: Math.round(rect.width) + "px",
              height: sliceHeight + 0.4 + "px",
              // adjust overlap fix
              backgroundImage: "url(".concat(image.src, ")"),
              backgroundSize: Math.round(rect.width) + "px " + totalHeight + "px",
              backgroundPosition: "0px -".concat(top, "px"),
              backgroundRepeat: "no-repeat",
              transformOrigin: origin,
              backfaceVisibility: "hidden",
              willChange: "transform"
            });
            container.appendChild(_slice);
            slices.push(_slice);
          }
        }
        image.style.opacity = 0;
        return {
          slices: slices,
          axis: axis
        };
      },
      applyStretchAnimation: function applyStretchAnimation(container, image, config) {
        var wrap = image.parentElement;
        gsap.set(container, {
          autoAlpha: 1
        });
        wrap.style.transition = "none";
        wrap.style.paddingBottom = "395px";
        var tl = gsap.timeline({
          scrollTrigger: {
            trigger: wrap,
            start: "top top",
            pin: true,
            scrub: 1,
            pinSpacing: false,
            end: "bottom bottom+=100"
          }
        });
        tl.to(image, {
          width: "100%",
          borderRadius: "0px"
        });
        this.timelines.push(tl);
        if (tl.scrollTrigger) this.scrollTriggers.push(tl.scrollTrigger);
      },
      applyAnimation: function applyAnimation(container, image, config) {
        if (config.mode === "stretch") {
          if (!elementorFrontend.isEditMode()) {
            this.applyStretchAnimation(container, image, config);
            setTimeout(function () {
              if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
            }, 50);
          } else {
            gsap.set(container, {
              autoAlpha: 1
            });
          }
          return;
        }
        var tl = gsap.timeline({
          delay: config.delay,
          scrollTrigger: {
            trigger: container,
            start: config.trigger,
            toggleActions: "play none none none"
          }
        });
        this.timelines.push(tl);
        if (tl.scrollTrigger) this.scrollTriggers.push(tl.scrollTrigger);
        tl.set(container, {
          autoAlpha: 1
        }, 0);
        switch (config.mode) {
          case "reveal":
            if (elementorFrontend.isEditMode()) {
              // Editor safe fallback like reveal
              gsap.set(container, {
                clipPath: "inset(0 0 0 0)"
              });
              gsap.fromTo(image, {
                scale: 1.2
              }, {
                scale: 1,
                duration: config.duration,
                delay: config.delay,
                ease: "power2.out"
              });
            }
            // Actual Reveal
            tl.from(container, {
              clipPath: this.getClipPath(config.direction),
              duration: config.duration,
              ease: config.easing
            }, 0);
            tl.fromTo(image, {
              scale: 1.2
            }, {
              scale: 1,
              duration: config.duration,
              ease: "power2.out"
            }, 0);
            break;
          case "corner-reveal":
            if (elementorFrontend.isEditMode()) {
              // Editor safe fallback like reveal
              gsap.set(container, {
                clipPath: "inset(0 0 0 0)"
              });
              gsap.fromTo(image, {
                scale: 1.15
              }, {
                scale: 1,
                duration: config.duration,
                delay: config.delay,
                ease: "power2.out"
              });
            }
            tl.from(container, {
              clipPath: this.getCornerClipPath(config.cornerDirection),
              duration: config.duration,
              ease: config.easing
            }, 0);
            tl.fromTo(image, {
              scale: 1.15
            }, {
              scale: 1,
              duration: config.duration,
              ease: "power2.out"
            }, 0);
            break;
          case "scale":
            tl.fromTo(image, {
              scale: config.scaleFrom,
              transformOrigin: this.getTransformOrigin(config.direction)
            }, {
              scale: config.scaleTo,
              duration: config.duration,
              ease: config.easing
            }, 0);
            break;
          case "tiles-reveal":
            var _this$createTiles = this.createTiles(container, image, config),
              slices = _this$createTiles.slices,
              axis = _this$createTiles.axis;
            tl.from(slices, _defineProperty(_defineProperty(_defineProperty(_defineProperty({}, axis, 0), "duration", config.duration), "ease", config.easing), "stagger", {
              each: config.tilesStaggerDelay,
              from: 'start'
            }));
            tl.to(image, {
              opacity: 1,
              duration: 0.2,
              onComplete: function onComplete() {
                return slices.forEach(function (s) {
                  return s.remove();
                });
              }
            });
            break;
        }
        setTimeout(function () {
          if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
        }, 50);
      }
    });
    elementorFrontend.hooks.addAction("frontend/element_ready/image.default", function ($scope) {
      elementorFrontend.elementsHandler.addHandler(HappyAIA, {
        $element: $scope
      });
    });
  });
})(jQuery, window);