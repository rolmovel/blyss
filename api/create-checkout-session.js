import { randomUUID } from 'crypto';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export default async function handler(req, res) {
  // Manejar la petición "preflight" de CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    return res.status(204).end();
  }

  // Añadir cabeceras CORS a la respuesta principal
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Solo permitir peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { cart, shippingAddress } = req.body;

    // Generar ID único para la transacción
    const transactionId = randomUUID();

    // Aquí puedes añadir la lógica para guardar la dirección en tu base de datos
    // Por ejemplo: await saveAddressToDatabase(shippingAddress);

    // Formatear los productos para la API de Stripe
    const line_items = cart.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.titulo,
          description: `Talla: ${item.size}, Color: ${item.color.nombre}`,
          images: [item.foto],
          metadata: {
            variant_id: item.cartItemId,
            product_id: item.id,
            size: item.size,
            color_name: item.color.nombre,
            color_code: item.color.codigo,
            quantity: item.quantity.toString(),
            unit_price: item.precio.toString(),
            transaction_id: transactionId
          }
        },
        unit_amount: Math.round(item.precio * 100),
      },
      quantity: item.quantity,
    }));

    // Obtener la URL base del sitio desde las cabeceras
    const siteUrl = req.headers.referer || 'http://localhost:8000';

    // Crear la sesión de pago en Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: line_items,
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['ES'],
      },
      metadata: {
        transaction_id: transactionId,
        order_summary: JSON.stringify({
          transaction_id: transactionId,
          total_items: cart.reduce((sum, item) => sum + item.quantity, 0),
          variant_ids: cart.map(item => ({
            variant_id: item.cartItemId,
            product_id: item.id,
            size: item.size,
            color_name: item.color.nombre,
            quantity: item.quantity,
            unit_price: item.precio
          })),
          subtotal: cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0),
        }),
        shipping_address: JSON.stringify(shippingAddress),
        customer_email: req.body.customerEmail || '',
      },
      success_url: `${siteUrl.split('/cart.html')[0]}/success.html`,
      cancel_url: `${siteUrl.split('/cart.html')[0]}/cart.html`,
    });

    return res.status(200).json({ id: session.id });

  } catch (error) {
    console.error('Error al crear la sesión de Stripe:', error);
    return res.status(500).json({ error: 'Error al procesar el pago.' });
  }
}
