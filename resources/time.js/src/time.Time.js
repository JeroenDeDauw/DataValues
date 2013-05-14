/**
 * time.js's Time constructor for parsing and representing a time.
 *
 * @dependency jQuery
 * TODO: get rid of heavy jQuery dependency
 *
 * @since 0.1
 * @file
 * @ingroup Time.js
 * @licence GNU GPL v2+
 *
 * @author Denny Vrandečić
 * @author Daniel Werner < daniel.werner@wikimedia.de >
 */
time.Time = ( function( time, $ ) {
	'use strict';

	/**
	 * Constructor for object representing a point in time with a certain precision.
	 *
	 * @param {string|Object} timeDefinition Text to be interpreted as time. Or a plain object
	 *        describing the time in the form of a time parser output.
	 * @param {Object} options
	 *        {number} precision: Precision which will overrule the automatically detected
	 *        precision.
	 *        {string} calendarname: Default calendar name overruling the automatically detected
	 *        calendar.
	 */
	var Time = function Time( timeDefinition, options ) {
		var result;

		options = $.extend( {
			precision: null,
			calendarname: null
		}, options );

		if( typeof timeDefinition === 'string' ) {
			result = time.Time.parse( timeDefinition );
		} else {
			result = $.extend( {}, timeDefinition );
		}
		if( result === null ) {
			result = {};
		}

		var year = (result.year !== undefined) ? result.year : null,
			month = (result.month !== undefined) ? result.month : 1,
			day = (result.day !== undefined) ? result.day : 1,
			hour = (result.hour !== undefined) ? result.hour : 0,
			minute = (result.minute !== undefined) ? result.minute : 0,
			second = (result.second !== undefined) ? result.second : 0,
			utcoffset = '+00:00',
			calendarname = ( options.calendarname )
				? options.calendarname
				: ( result.calendarname !== undefined ) ? result.calendarname : 'Gregorian';

		this.year = function() {
			return year;
		};

		this.month = function() {
			return month;
		};

		this.day = function() {
			return day;
		};

		this.utcoffset = function() {
			return utcoffset;
		};

		var precision = ( options.precision ) ? options.precision : result.precision;
		this.precision = function() {
			return precision;
		};

		this.precisionText = function() {
			return time.precisionText( precision );
		};

		var before = 0,
			after = 0;

		this.before = function() {
			return before;
		};

		this.after = function() {
			return after;
		};

		this.gregorian = function() {
			if( calendarname === Time.CALENDAR.GREGORIAN ) {
				return {
					'year': year,
					'month': month,
					'day': day
				};
			} else if( calendarname === Time.CALENDAR.JULIAN ) {
				return time.julianToGregorian( year, month, day );
			}
		};

		this.julian = function() {
			if( calendarname === Time.CALENDAR.JULIAN ) {
				return {
					'year': year,
					'month': month,
					'day': day
				};
			} else if( calendarname === Time.CALENDAR.GREGORIAN ) {
				if( year !== null ) {
					return time.gregorianToJulian( year, month, day );
				}
			}
			return null;
		};

		this.jdn = function() {
			if( year === null ) {
				return null;
			}
			if( calendarname === Time.CALENDAR.GREGORIAN ) {
				return time.gregorianToJulianDay( year, month, day );
			} else {
				return time.julianToJulianDay( year, month, day );
			}
		};

		this.calendarText = function() {
			return calendarname;
		};

		this.calendarURI = function() {
			if( calendarname === Time.CALENDAR.GREGORIAN ) {
				return 'http://wikidata.org/id/Q1985727';
			} else if( calendarname === Time.CALENDAR.JULIAN ) {
				return 'http://wikidata.org/id/Q1985786';
			}
		};

		this.iso8601 = function() {
			var g = this.gregorian();
			return ( ( g.year < 0 ) ? '-' : '+' ) + pad( g.year, 11 ) + '-' + pad( g.month, 2 )
				+ '-' + pad( g.day, 2 ) + 'T' + pad( hour, 2 ) + ':' + pad( minute, 2 )
				+ ':' + pad( second, 2 ) + 'Z';
		};

		this.text = function() {
			return time.getTextFromDate( precision, year, month, day );
		};

		/**
		 * Returns whether the Object is representing any time at all. This will be false if the
		 * value passed to the constructor has not been interpreted as time.
		 *
		 * TODO: throw an error if invalid Time, don't support invalid data objects and deprecate
		 *  this function then.
		 *
		 * @returns {boolean}
		 */
		this.isValid = function() {
			return this.year() !== null;
		};

		this.gregorianText = function() {
			var result = this.gregorian();
			return time.getTextFromDate( precision, result.year, result.month, result.day );
		};

		this.julianText = function() {
			var result = this.julian();
			if( result === null ) {
				return '';
			}
			return time.getTextFromDate( precision, result.year, result.month, result.day );
		};
	};

	function pad( number, digits ) {
		return ( 1e12 + Math.abs( number ) + '' ).slice( -digits );
	}

	/**
	 * Creates a new Time object by a given iso8601 string.
	 *
	 * TODO: this function shouldn't really be required since the parser should simply be able to
	 *       take such a string and create a new Time object from it.
	 *
	 * @param {string} iso8601String
	 * @param {number} [precision] If not given, precision will be as high as possible.
	 */
	Time.newFromIso8601 = function( iso8601String, precision ) {
		// The parser only takes the iso8601 string in a certain format right now. We have to bring
		// it into that form first:
		var formattedIso8601 = iso8601String
			.replace( /T.+$/, '' ) // get rid of minutes (not supported yet)
			// Get rid of year's leading zeros (but keep one if the year actually is 0)
			// and keep "-" and "+":
			.replace( /^([\-\+])?0*(0|[1-9]+)/, '$1$2' )
			.replace( '+', '' ); // get rid of "+"

		return new Time( formattedIso8601, { precision: precision } );
	};

	/**
	 * All possible precisions of Time.
	 * @type {Object} holding fields of type number
	 */
	Time.PRECISION = {
		GY: 0, // Gigayear
		MY100: 1, // 100 Megayears
		MY10: 2, // 10 Megayears
		MY: 3, // Megayear
		KY100: 4, // 100 Kiloyears
		KY10: 5, // 10 Kiloyears
		KY: 6, // Kiloyear
		YEAR100: 7, // 100 years
		YEAR10: 8, // 10 years
		YEAR: 9,
		MONTH: 10,
		DAY: 11,
		HOUR: 12,
		MINUTES: 13,
		SECOND: 14
	};

	/**
	 * All supported calendar models
	 * @type {Object}
	 */
	Time.CALENDAR = {
		GREGORIAN: 'Gregorian',
		JULIAN: 'Julian'
	};

	return Time; // expose time.Time

}( time, jQuery ) );
