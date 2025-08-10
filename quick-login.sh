#!/bin/bash

echo "🚀 Opening Quick Login Page..."
echo "================================"
echo ""
echo "This will open a page where you can click any supervisor to login instantly."
echo ""

# Check if quick-login.html exists
if [ -f "quick-login.html" ]; then
    echo "✅ Quick login page found"
    echo ""
    echo "Instructions:"
    echo "1. Click on 'AG003 - Anthony Gair' (recommended)"
    echo "2. You'll be automatically logged in"
    echo "3. The page will redirect to the Breakdown Guide"
    echo ""
    echo "Opening in browser..."
    open quick-login.html
    echo ""
    echo "✅ Quick login page opened!"
else
    echo "❌ Quick login page not found"
    echo "Creating it now..."
    
    # Create the file if it doesn't exist
    cat > quick-login.html << 'QUICKLOGIN'
<!DOCTYPE html>
<html>
<head>
    <title>Quick Login</title>
    <style>
        body { font-family: Arial; padding: 40px; text-align: center; }
        button { padding: 20px 40px; font-size: 20px; margin: 10px; cursor: pointer; background: #ce0e2d; color: white; border: none; border-radius: 8px; }
        button:hover { background: #a00922; }
    </style>
</head>
<body>
    <h1>Quick Login to Breakdown Guide</h1>
    <button onclick="login()">Login as Anthony Gair (AG003)</button>
    <script>
        function login() {
            localStorage.setItem('supervisor_session', JSON.stringify({
                supervisorId: 'supervisor003',
                supervisorName: 'Anthony Gair',
                name: 'Anthony Gair',
                badge: 'AG003',
                depot: 'Quick Login',
                isAdmin: true,
                token: 'quick-' + Date.now(),
                timestamp: new Date().toISOString()
            }));
            alert('Logged in! Redirecting...');
            window.location.href = 'Go_BARRY/public/breakdown-guide/index.html';
        }
    </script>
</body>
</html>
QUICKLOGIN
    
    echo "✅ Quick login page created"
    echo "Opening in browser..."
    open quick-login.html
fi

echo ""
echo "================================"
echo "If the page doesn't work, use the emergency console command:"
echo ""
echo "1. Open the breakdown guide in your browser"
echo "2. Open console (F12)"
echo "3. Paste this command:"
echo ""
echo "localStorage.setItem('supervisor_session',JSON.stringify({supervisorId:'supervisor003',name:'Anthony Gair',badge:'AG003',isAdmin:true,token:'emergency',timestamp:new Date().toISOString()}));location.reload();"
echo ""
