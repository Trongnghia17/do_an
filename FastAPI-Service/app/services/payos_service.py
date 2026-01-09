import hmac
import hashlib
import json
import httpx
from typing import Optional, Dict, Any
from datetime import datetime
from loguru import logger

from app.config import settings


class PayOSService:
    """PayOS Payment Gateway Service"""
    
    BASE_URL = "https://api-merchant.payos.vn/v2"
    
    def __init__(self):
        self.client_id = settings.PAYOS_CLIENT_ID
        self.api_key = settings.PAYOS_API_KEY
        self.checksum_key = settings.PAYOS_CHECKSUM_KEY
        self.return_url = settings.PAYOS_RETURN_URL
        self.cancel_url = settings.PAYOS_CANCEL_URL
    
    def _generate_signature(self, data: str) -> str:
        """Generate HMAC SHA256 signature for PayOS request"""
        return hmac.new(
            self.checksum_key.encode('utf-8'),
            data.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
    
    def _get_headers(self) -> Dict[str, str]:
        """Get headers for PayOS API requests"""
        return {
            "x-client-id": self.client_id,
            "x-api-key": self.api_key,
            "Content-Type": "application/json"
        }
    
    async def create_payment_link(
        self,
        order_code: int,
        amount: int,
        description: str,
        buyer_name: str,
        buyer_email: str
    ) -> Optional[Dict[str, Any]]:
        """
        Create payment link with PayOS
        
        Args:
            order_code: Unique order code (integer)
            amount: Amount in VND
            description: Payment description
            buyer_name: Buyer name
            buyer_email: Buyer email
            
        Returns:
            Payment link data or None if failed
        """
        try:
            # Create signature (MUST be in alphabetical order)
            signature_data = f"amount={amount}&cancelUrl={self.cancel_url}&description={description}&orderCode={order_code}&returnUrl={self.return_url}"
            signature = self._generate_signature(signature_data)
            
            # Prepare payment data
            payment_data = {
                "orderCode": order_code,
                "amount": amount,
                "description": description,
                "items": [
                    {
                        "name": "Nạp Trứng Cú",
                        "quantity": 1,
                        "price": amount
                    }
                ],
                "cancelUrl": self.cancel_url,
                "returnUrl": self.return_url,
                "signature": signature
            }
            
            # Add optional buyer info if provided
            if buyer_name:
                payment_data["buyerName"] = buyer_name
            if buyer_email:
                payment_data["buyerEmail"] = buyer_email
            
            # Set expiration time (15 minutes from now) - must be in the future!
            from time import time
            current_timestamp = int(time())
            payment_data["expiredAt"] = current_timestamp + 900  # 15 minutes
            
            logger.info(f"Creating PayOS payment link for order {order_code}")
            logger.debug(f"Signature data: {signature_data}")
            logger.debug(f"Signature: {signature}")
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.BASE_URL}/payment-requests",
                    headers=self._get_headers(),
                    json=payment_data
                )
                
                if response.status_code == 200:
                    result = response.json()
                    logger.info(f"PayOS payment link created successfully: {result}")
                    
                    # PayOS returns data in "data" field
                    if result.get("code") == "00":
                        return result.get("data")
                    else:
                        logger.error(f"PayOS returned error code: {result.get('code')} - {result.get('desc')}")
                        return None
                else:
                    logger.error(f"PayOS API error: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error creating PayOS payment link: {str(e)}")
            return None
    
    async def get_payment_info(self, order_code: int) -> Optional[Dict[str, Any]]:
        """
        Get payment information from PayOS
        
        Args:
            order_code: Order code to query
            
        Returns:
            Payment information or None if failed
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.BASE_URL}/payment-requests/{order_code}",
                    headers=self._get_headers()
                )
                
                if response.status_code == 200:
                    result = response.json()
                    # PayOS returns data in "data" field
                    if result.get("code") == "00":
                        return result.get("data")
                    else:
                        logger.error(f"PayOS returned error code: {result.get('code')} - {result.get('desc')}")
                        return None
                else:
                    logger.error(f"PayOS get payment info error: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error getting PayOS payment info: {str(e)}")
            return None
    
    async def cancel_payment(self, order_code: int, reason: str = "Người dùng hủy") -> bool:
        """
        Cancel a payment request
        
        Args:
            order_code: Order code to cancel
            reason: Cancellation reason
            
        Returns:
            True if successful, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.put(
                    f"{self.BASE_URL}/payment-requests/{order_code}/cancel",
                    headers=self._get_headers(),
                    json={"cancellationReason": reason}
                )
                
                return response.status_code == 200
                
        except Exception as e:
            logger.error(f"Error cancelling PayOS payment: {str(e)}")
            return False
    
    def verify_webhook_signature(self, webhook_data: Dict[str, Any], signature: str) -> bool:
        """
        Verify webhook signature from PayOS
        
        Args:
            webhook_data: Webhook payload
            signature: Signature from webhook header
            
        Returns:
            True if signature is valid, False otherwise
        """
        try:
            # Sort and create signature string
            sorted_keys = sorted(webhook_data.keys())
            signature_string = "&".join([f"{key}={webhook_data[key]}" for key in sorted_keys])
            
            calculated_signature = self._generate_signature(signature_string)
            
            return hmac.compare_digest(calculated_signature, signature)
            
        except Exception as e:
            logger.error(f"Error verifying webhook signature: {str(e)}")
            return False


# Singleton instance
payos_service = PayOSService()
