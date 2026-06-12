import fetch from 'node-fetch' // Wait, does the project package.json have node-fetch?
// Let's use the built-in global fetch which is available in Node 18+
async function run() {
  try {
    const res = await fetch('http://localhost:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: '+2348000000000',
        password: 'Password123'
      })
    })
    console.log('Status:', res.status)
    const text = await res.text()
    console.log('Body:', text)
  } catch (err) {
    console.error('Error making request:', err.message)
  }
}

run()
