const TERMII_API_KEY = process.env.TERMII_API_KEY
const BASE_URL = 'https://api.ng.termii.com/api'

export const sendOtp = async (phoneNumber) => {
  try {
    let formattedPhone = phoneNumber.replace(/[^0-9]/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '234' + formattedPhone.substring(1)
    }

    const payload = {
      api_key: TERMII_API_KEY,
      message_type: 'NUMERIC',
      to: formattedPhone,
      from: 'N-Alert',
      channel: 'dnd',
      pin_attempts: 3,
      pin_time_to_live: 10,
      pin_length: 6,
      pin_placeholder: '< 1234 >',
      message_text: 'Your MeCal password reset code is < 1234 >. It expires in 10 minutes.'
    }

    const response = await fetch(`${BASE_URL}/sms/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    const data = await response.json()
    console.log('Termii API Response:', data)
    
    if (data && data.pinId) {
      return { success: true, pinId: data.pinId }
    } else {
      console.error('Termii error response:', data)
      const errorMsg = data.message || (data.comment ? data.comment[0] : 'Unknown error')
      throw new Error(`Termii error: ${errorMsg}`)
    }
  } catch (error) {
    console.error('Termii send OTP error:', error.message)
    throw new Error('Failed to send verification code')
  }
}

export const verifyOtp = async (pinId, pin) => {
  try {
    const payload = {
      api_key: TERMII_API_KEY,
      pin_id: pinId,
      pin: pin
    }

    const response = await fetch(`${BASE_URL}/sms/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    const data = await response.json()
    
    if (data && data.verified) {
      return { success: true }
    } else {
      return { success: false, message: data.comment || 'Invalid or expired OTP' }
    }
  } catch (error) {
    console.error('Termii verify OTP error:', error.message)
    return { success: false, message: 'Failed to verify OTP' }
  }
}
