'use strict';

/**
 * success service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::success.success');
