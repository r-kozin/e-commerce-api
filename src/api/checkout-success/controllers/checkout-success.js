const stripe = require("stripe")(process.env.STRIPE_KEY);
const webhookSecret = process.env.WEBHOOK_SECRET;
const unparsed = require("koa-body/unparsed.js");

("use strict");

const fulfillOrder = (lineItems) => {
  // TODO: Add logic from Orders.js to remove quantity from inventory
  console.log("Fulfilling order", lineItems);
}

/**
 * A set of functions called "actions" for `checkout-success`
 */
module.exports = {
  success: async (ctx, next) => {
    const payload = ctx.request.body[unparsed];
    const sig = ctx.request.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    } catch (err) {
      return ctx.badRequest(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      // Retrieve the session. If you require line items in the response, you may include them by expanding line_items.
      const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
        event.data.object.id,
        {
          expand: ['line_items'],
        }
      );
      const lineItems = sessionWithLineItems.line_items;

      fulfillOrder(lineItems);
    }

    // Return a response to acknowledge receipt of the event
    console.log('✅ Success:', event.id);
    return { received: true };
  },
};
