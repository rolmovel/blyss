const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async (event) => {
  // Manejar la petición "preflight" de CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204, 
      headers: corsHeaders,
      body: ''
    };
  }

  // Solo permitir peticiones POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };
  }

  try {
    const cartItems = JSON.parse(event.body);

    // Formatear los productos para la API de Stripe
    const line_items = cartItems.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.titulo,
          description: `Talla: ${item.size}, Color: ${item.color.nombre}`,
          images: [item.foto], 
        },
        unit_amount: Math.round(item.precio * 100), 
      },
      quantity: item.quantity,
    }));

    // Obtener la URL base del sitio desde las cabeceras del evento
    const siteUrl = event.headers.referer || 'http://localhost:8000';

    // Crear la sesión de pago en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      success_url: `${siteUrl.split('/cart.html')[0]}/success.html`,
      cancel_url: `${siteUrl.split('/cart.html')[0]}/cart.html`,
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ id: session.id }),
    };

  } catch (error) {
    console.error('Error al crear la sesión de Stripe:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Error al procesar el pago.' }),
    };
  }
};
