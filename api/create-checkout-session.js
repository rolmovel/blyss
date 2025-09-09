const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Solo permitir peticiones POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
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
          images: [item.foto], // Stripe necesita una URL pública para la imagen
        },
        unit_amount: Math.round(item.precio * 100), // El precio debe estar en céntimos
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
      body: JSON.stringify({ id: session.id }),
    };

  } catch (error) {
    console.error('Error al crear la sesión de Stripe:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error al procesar el pago.' }),
    };
  }
};
