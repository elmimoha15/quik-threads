# 🔄 POLAR ARCHITECTURE FIX - Backend Checkout Creation

## ❌ Current Problem

You have an **OAT (Organization Access Token)** (`polar_oat_...`) which is correct, but:
- ⚠️ **Cannot be used in frontend/browser** (security risk - Polar will revoke it!)
- ✅ **Must be used in backend only**

## ✅ Correct Architecture

```
Frontend (Browser)          Backend (Server)           Polar API
     │                           │                          │
     │  1. Click "Buy Pro"       │                          │
     ├──────────────────────────>│                          │
     │   POST /api/create-checkout                         │
     │   { planType: "pro" }     │                          │
     │                           │                          │
     │                           │  2. Create checkout      │
     │                           │  with OAT token          │
     │                           ├─────────────────────────>│
     │                           │  POST /v1/checkouts      │
     │                           │  Authorization: Bearer   │
     │                           │    polar_oat_xxxxx       │
     │                           │                          │
     │                           │<─────────────────────────┤
     │                           │  { url: "polar.sh/..." } │
     │                           │                          │
     │<──────────────────────────┤                          │
     │   { checkoutUrl: "..." }  │                          │
     │                           │                          │
     │  3. Redirect to Polar     │                          │
     ├──────────────────────────────────────────────────────>
     │   window.location = url   │                          │
```

## 🔧 Implementation Steps

### Step 1: Move OAT Token to Backend

**Backend `.env`** (`quikthread-backend/.env`):
```bash
# Add your OAT token here (it's safe on the server)
POLAR_ACCESS_TOKEN=polar_oat_IZj1lmHckWAAvFUU8KfCY2yR4y8VniNdEsq1q1qm22E

# Product/Price IDs
POLAR_PRODUCT_ID_PRO=3a2469dd-6384-4945-b158-deac976dc461
POLAR_PRODUCT_ID_BUSINESS=f3f7363c-2073-4935-a201-e0d29a756ba0

# Webhook secret (already there)
POLAR_WEBHOOK_SECRET=polar_whs_5ZrQ1kxewzcaL8tUpP3U3eSW0Z2WaEMLMOMEQ4e7Dj1
```

**Frontend `.env`** (`frontend/.env`):
```bash
# REMOVE the OAT token from frontend - it's not safe here!
# Delete this line:
# VITE_POLAR_ACCESS_TOKEN=polar_oat_...

# Keep Firebase config and backend URL
VITE_API_URL=http://localhost:8000
```

### Step 2: Create Backend Endpoint

Create new file: `quikthread-backend/routes/polar.py`

```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import httpx
import os

router = APIRouter()

POLAR_ACCESS_TOKEN = os.getenv('POLAR_ACCESS_TOKEN')
POLAR_API_BASE = 'https://sandbox-api.polar.sh/v1'
POLAR_PRODUCT_ID_PRO = os.getenv('POLAR_PRODUCT_ID_PRO')
POLAR_PRODUCT_ID_BUSINESS = os.getenv('POLAR_PRODUCT_ID_BUSINESS')

class CreateCheckoutRequest(BaseModel):
    plan_type: str  # 'pro' or 'business'
    customer_email: str
    customer_name: str | None = None
    user_id: str

class CreateCheckoutResponse(BaseModel):
    checkout_url: str

@router.post("/create-checkout", response_model=CreateCheckoutResponse)
async def create_checkout(request: CreateCheckoutRequest):
    """
    Create a Polar checkout session (server-side)
    This keeps the OAT token secure on the backend
    """
    try:
        # Select product ID based on plan type
        product_id = (
            POLAR_PRODUCT_ID_PRO 
            if request.plan_type == 'pro' 
            else POLAR_PRODUCT_ID_BUSINESS
        )
        
        # Construct success URL
        success_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/#/checkout-success?plan={request.plan_type}"
        
        # Create checkout via Polar API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{POLAR_API_BASE}/checkouts/",
                headers={
                    "Authorization": f"Bearer {POLAR_ACCESS_TOKEN}",
                    "Content-Type": "application/json",
                },
                json={
                    "products": [product_id],
                    "customer_email": request.customer_email,
                    "success_url": success_url,
                    "metadata": {
                        "user_id": request.user_id,
                        "plan_type": request.plan_type,
                    }
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                error_detail = response.json() if response.text else "Unknown error"
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Polar API error: {error_detail}"
                )
            
            checkout_data = response.json()
            return CreateCheckoutResponse(checkout_url=checkout_data.get("url"))
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Failed to create checkout: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
```

### Step 3: Register Route in main.py

Edit `quikthread-backend/main.py`:

```python
# Add import at top
from routes import polar

# Add route registration (with other routes)
app.include_router(polar.router, prefix="/api/polar", tags=["polar"])
```

### Step 4: Update Frontend Service

Edit `frontend/src/lib/polarService.ts`:

```typescript
// REMOVE the Polar SDK import - we're calling our backend now
// DELETE: import { Polar } from '@polar-sh/sdk';

export interface CheckoutCreateParams {
  planType: 'pro' | 'business';
  customerEmail: string;
  customerName?: string;
  userId: string;
}

class PolarService {
  /**
   * Create a checkout session via our backend
   * This keeps the OAT token secure on the server
   */
  async createCheckout(params: CheckoutCreateParams): Promise<string> {
    try {
      console.log('Creating checkout via backend:', params);
      
      const response = await fetch('http://localhost:8000/api/polar/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_type: params.planType,
          customer_email: params.customerEmail,
          customer_name: params.customerName,
          user_id: params.userId,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create checkout');
      }
      
      const data = await response.json();
      console.log('Checkout created successfully:', data);
      
      return data.checkout_url;
    } catch (error: any) {
      console.error('Failed to create checkout:', error);
      throw new Error(error.message || 'Failed to create checkout session');
    }
  }

  /**
   * Create checkout and immediately redirect user
   */
  async checkoutAndRedirect(params: CheckoutCreateParams): Promise<void> {
    const checkoutUrl = await this.createCheckout(params);
    window.location.href = checkoutUrl;
  }
}

export const polarService = new PolarService();
```

### Step 5: Update PlanSelectionStep

Edit `frontend/src/components/onboarding/PlanSelectionStep.tsx`:

```typescript
// Update handleCheckout function
const handleCheckout = async (planId: string) => {
  if (!currentUser?.email || !currentUser?.uid) {
    toast.error('Please log in to continue');
    return;
  }

  setProcessingCheckout(true);

  try {
    await polarService.checkoutAndRedirect({
      planType: planId as 'pro' | 'business',
      customerEmail: currentUser.email,
      customerName: currentUser.displayName || undefined,
      userId: currentUser.uid,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    toast.error(error.message || 'Failed to start checkout');
    setProcessingCheckout(false);
  }
};
```

## 🎯 Why This Works

✅ **OAT token stays on backend** (secure!)  
✅ **Frontend only sends user data** (email, plan type)  
✅ **Backend creates checkout** (with secure token)  
✅ **User redirects to Polar** (standard flow)  
✅ **Webhooks work the same** (already configured)

## 📋 Summary of Changes

| File | Action |
|------|--------|
| `quikthread-backend/.env` | Add `POLAR_ACCESS_TOKEN`, product IDs |
| `quikthread-backend/routes/polar.py` | **NEW** - Create checkout endpoint |
| `quikthread-backend/main.py` | Register polar router |
| `quikthread-backend/requirements.txt` | Add `httpx` if not present |
| `frontend/.env` | **REMOVE** `VITE_POLAR_ACCESS_TOKEN` |
| `frontend/src/lib/polarService.ts` | Replace SDK with fetch to backend |
| `frontend/src/components/onboarding/PlanSelectionStep.tsx` | Update params |

---

**This is the CORRECT and SECURE way to integrate Polar!** 🔒🚀
