const stripe = require("stripe")(process.env.STRIPE_KEY);

("use strict");

/**
 * order controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async create(ctx) {
    const { products } = ctx.request.body;

    const shippingRates = [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 0,
            currency: "usd",
          },
          display_name:
            "Pickup at Eastern Market (Saturday 9am-12pm) 2934 Russell St, Detroit, MI 48207",
          // delivery_estimate: {
          //   minimum: {
          //     unit: 'business_day',
          //     value: 5,
          //   },
          //   maximum: {
          //     unit: 'business_day',
          //     value: 7,
          //   },
          // },
        },
      },
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 1500,
            currency: "usd",
          },
          display_name: "Next day air",
          delivery_estimate: {
            minimum: {
              unit: "business_day",
              value: 1,
            },
            maximum: {
              unit: "business_day",
              value: 1,
            },
          },
        },
      },
    ];
    
    //TODO: Move to webhook
    // products.map(async (product) => {
    //   //map through products
    //   const itemInDB = await strapi
    //     .service("api::product.product")
    //     .findOne(product.id); //match products to product in db

    //   const numAvailable = itemInDB.available; //get available quantity for each product
    //   const numOrdered = product.quantity; //get quantity ordered for each product

    //   if (numOrdered > numAvailable) {
    //     ctx.response.status = 400;
    //     console.log(`There are only ${numAvailable} ${itemInDB.title} available`)
    //     return `There are only ${numAvailable} ${itemInDB.title} available`;
    //   } else {
    //     await strapi.service("api::product.product").update(product.id, {
    //       data: {
    //         available: numAvailable - product.quantity, //subtract quantity ordered from available
    //       },
    //     });
    //   }
    // });

    const lineItems = await Promise.all(
      products.map(async (product) => {
        //map through products
        const item = await strapi
          .service("api::product.product")
          .findOne(product.id); //match products to product in db

        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: item.title,
            },
            unit_amount: item.price * 100,
          },
          quantity: product.quantity, //get quantity for each product
        };
      })
    );
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        success_url: `${process.env.CLIENT_URL}/success`,
        cancel_url: `${process.env.CLIENT_URL}?success=false`,
        shipping_options: shippingRates,
        line_items: lineItems,
        billing_address_collection: "required", //require billing address
        shipping_address_collection: {
          allowed_countries: ["US"],
        },
        payment_method_types: ["card"],
      });

      await strapi.service("api::order.order").create({
        data: {
          products,
          stripeId: session.id,
        },
      });

      return { stripeSession: session };
    } catch (err) {
      ctx.response.status = 500;
      return err;
    }
  },
}));
