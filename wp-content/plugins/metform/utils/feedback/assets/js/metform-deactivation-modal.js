/**
 * MetForm Deactivation Feedback Modal
 *
 * Intercepts the plugin deactivation link, presents a feedback modal,
 * submits the user's response via AJAX, then redirects to complete
 * the deactivation regardless of submission outcome.
 *
 * Depends on: jQuery, MetFormDeactivation (localised)
 *
 * @file   metform-deactivation-modal.js
 * @since  1.0.0
 */

/* global MetFormDeactivation */

( function ( $ ) {
    'use strict';

    var ANIMATION_DURATION = 300;
    var CLASS_OPEN = 'open';
    var CLASS_LOADING = 'loading';

    var MetFormDeactivationModal = {
        modal: null,
        form: null,
        deactivateLink: null,
        isProcessing: false,
        deactivateLinkHref: null,

        init: function () {
            if (
                'undefined' !== typeof MetFormDeactivation &&
                false === MetFormDeactivation.show_modal
            ) {
                return;
            }

            this.cacheElements();
            this.bindEvents();
            this.syncFeedbackState();
        },

        cacheElements: function () {
            this.modal = $( '#mf-deactivation-modal' );
            this.form = $( '#mf-deactivation-form' );
            this.deactivateLink = $( '#deactivate-metform, tr[data-slug="metform"] .deactivate a, a[href*="plugin=metform/metform.php"][href*="deactivate"], a[href*="metform.php"][href*="deactivate"]' );
        },

        bindEvents: function () {
            var self = this;

            if ( this.deactivateLink.length ) {
                this.deactivateLink.on( 'click.mfModal', function ( e ) {
                    e.preventDefault();
                    self.deactivateLinkHref = $( this ).attr( 'href' );
                    $( '.mf-deactivation-skip' ).data( 'deactivate-link', self.deactivateLinkHref );
                    self.openModal();
                } );
            }

            this.form.on( 'submit.mfModal', function ( e ) {
                e.preventDefault();
                self.submitForm();
            } );

            $( '.mf-deactivation-close' ).on( 'click.mfModal', function () {
                self.closeModal();
            } );

            $( '.mf-deactivation-skip' ).on( 'click.mfModal', function () {
                var href = $( this ).data( 'deactivate-link' );
                if ( href ) {
                    window.location.href = href;
                }
            } );

            this.form.on( 'change.mfModal', 'input[name="reason"]', function () {
                self.hideAllFeedbacks();
                self.showFeedbackForReason( $( this ).closest( '.mf-deactivation-radio-item' ).data( 'reason-key' ) );
            } );

            this.modal.on( 'click.mfModal', function ( e ) {
                if ( $( e.target ).is( self.modal ) ) {
                    self.closeModal();
                }
            } );

            $( document ).on( 'keydown.mfModal', function ( e ) {
                if ( 'Escape' === e.key && self.modal.hasClass( CLASS_OPEN ) ) {
                    self.closeModal();
                }
            } );
        },

        openModal: function () {
            this.modal.addClass( CLASS_OPEN );
            $( 'body' ).css( 'overflow', 'hidden' );
            this.hideErrorMessage();
            this.syncFeedbackState();
        },

        closeModal: function () {
            this.modal.removeClass( CLASS_OPEN );
            $( 'body' ).css( 'overflow', '' );
            this.form[ 0 ].reset();
            this.hideErrorMessage();
            this.hideAllFeedbacks();
        },

        syncFeedbackState: function () {
            var $checkedRadio = this.form.find( 'input[name="reason"]:checked' );
            if ( ! $checkedRadio.length ) {
                return;
            }

            this.hideAllFeedbacks();
            this.showFeedbackForReason( $checkedRadio.closest( '.mf-deactivation-radio-item' ).data( 'reason-key' ) );
        },

        submitForm: function () {
            var self = this;

            if ( this.isProcessing ) {
                return;
            }

            var $selectedRadio = this.form.find( 'input[name="reason"]:checked' );
            var selectedReason = $selectedRadio.val();

            if ( ! selectedReason ) {
                this.showErrorMessage( 'Please select a reason first.' );
                return;
            }

            var $selectedItem = $selectedRadio.closest( '.mf-deactivation-radio-item' );
            var reasonKey = $selectedItem.data( 'reason-key' );
            var payload = {
                action: 'metform_deactivation_feedback',
                metform_nonce: this.form.find( 'input[name="metform_nonce"]' ).val(),
                reason: selectedReason,
                reason_key: $selectedItem.find( '.mf-reason-key' ).val() || '',
                reason_label: $selectedItem.find( '.mf-reason-label' ).val() || selectedReason,
                feedback: $selectedItem.find( 'textarea[name="feedback_' + reasonKey + '"]' ).val() || '',
            };

            this.setProcessing( true );

            $.ajax( {
                type: 'POST',
                url: MetFormDeactivation.ajaxurl,
                data: payload,
                success: function () {},
                error: function ( xhr, status, error ) {
                    window.console.error( 'MetForm: deactivation feedback error —', error );
                },
                complete: function () {
                    self.setProcessing( false );

                    var href = $( '.mf-deactivation-skip' ).data( 'deactivate-link' );
                    if ( href ) {
                        window.location.href = href;
                    }
                },
            } );
        },

        hideAllFeedbacks: function () {
            $( '.mf-deactivation-radio-feedback' ).removeClass( 'active' );
        },

        showFeedbackForReason: function ( reason ) {
            if ( ! reason ) {
                return;
            }

            $( '.mf-deactivation-radio-item[data-reason-key="' + reason + '"] .mf-deactivation-radio-feedback' ).addClass( 'active' );
        },

        showErrorMessage: function ( message ) {
            $( '#mf-deactivation-error-message' ).html( message ).slideDown( ANIMATION_DURATION );
        },

        hideErrorMessage: function () {
            var $error = $( '#mf-deactivation-error-message' );
            $error.slideUp( ANIMATION_DURATION, function () {
                $error.html( '' );
            } );
        },

        setProcessing: function ( state ) {
            this.isProcessing = state;
            $( '.mf-deactivation-submit' ).prop( 'disabled', state ).toggleClass( CLASS_LOADING, state );
        },
    };

    $( document ).ready( function () {
        MetFormDeactivationModal.init();
    } );

    window.MetFormDeactivationModal = MetFormDeactivationModal;

} )( jQuery );
