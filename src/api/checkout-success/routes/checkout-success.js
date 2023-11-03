module.exports = {
  routes: [
    {
     method: 'POST',
     path: '/checkout-success',
     handler: 'checkout-success.success',
     config: {
       policies: [],
       middlewares: [],
     },
    },
  ],
};
