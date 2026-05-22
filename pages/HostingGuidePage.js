import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ArrowLeft, Server, Terminal, Shield, Globe, Database, CheckCircle, Cloud, Cpu, HardDrive, Lock, Zap } from 'lucide-react';

const steps = [
  {
    title: "Create an Oracle Cloud Instance",
    icon: <Cloud className="w-5 h-5" />,
    code: `# In OCI Console: Compute > Instances > Create Instance
# Image: Ubuntu 22.04 or 24.04 (Always Free eligible)
# Shape: VM.Standard.E2.1.Micro (AMD, 1 OCPU, 1 GB RAM)
# Boot volume: 50 GB
# Networking: Public subnet with public IP
# SSH keys: Upload your public key`,
    description: "Create a free AMD micro instance running Ubuntu. The Always Free tier includes 2 instances with 200 GB total storage."
  },
  {
    title: "Open Firewall Ports (OCI + UFW)",
    icon: <Lock className="w-5 h-5" />,
    code: `# OCI Console: Networking > VCN > Subnet > Security List
# Add Ingress Rules for TCP ports: 22, 80, 443

# Then SSH in and configure Ubuntu firewall:
ssh -i ~/.ssh/id_rsa ubuntu@YOUR_PUBLIC_IP

sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable`,
    description: "Oracle Cloud blocks all inbound traffic by default. Open HTTP, HTTPS, and SSH in both the OCI Security List and Ubuntu's UFW firewall."
  },
  {
    title: "Install System Dependencies",
    icon: <Server className="w-5 h-5" />,
    code: `sudo apt update && sudo apt upgrade -y

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g yarn

# Python 3, Nginx, Certbot, Git
sudo apt install -y python3 python3-pip python3-venv nginx \\
  certbot python3-certbot-nginx git

# Add 2 GB swap (recommended for 1 GB RAM instance)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab`,
    description: "Install Node.js, Python 3, Nginx, and SSL tools. Adding swap prevents out-of-memory crashes during builds."
  },
  {
    title: "Clone & Setup Backend",
    icon: <Database className="w-5 h-5" />,
    code: `sudo mkdir -p /var/www/blogs4blocks
sudo chown ubuntu:ubuntu /var/www/blogs4blocks
cd /var/www/blogs4blocks
git clone <your-repo-url> .

cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

cat > .env << 'EOF'
MONGO_URL=mongodb+srv://USER:PASS@cluster.mongodb.net
DB_NAME=blogs4blocks
JWT_SECRET=$(openssl rand -hex 32)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
RESEND_API_KEY=your_resend_api_key
SENDER_EMAIL=noreply@yourdomain.com
ADMIN_SETUP_KEY=your-secure-admin-key
EOF`,
    description: "Clone your repo, set up a Python virtual environment, and configure environment variables. Use MongoDB Atlas (free tier) for the database."
  },
  {
    title: "Build Frontend",
    icon: <Globe className="w-5 h-5" />,
    code: `cd /var/www/blogs4blocks/frontend
echo 'REACT_APP_BACKEND_URL=https://yourdomain.com' > .env
yarn install && yarn build`,
    description: "Install frontend dependencies and create an optimized production build."
  },
  {
    title: "Configure Nginx",
    icon: <Shield className="w-5 h-5" />,
    code: `sudo tee /etc/nginx/sites-available/blogs4blocks << 'NGINX'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/blogs4blocks/frontend/build;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 10M;
    }

    location /api/ws/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/blogs4blocks /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx`,
    description: "Set up Nginx as a reverse proxy for the API and serve the React build for all frontend routes."
  },
  {
    title: "SSL + Systemd Service",
    icon: <CheckCircle className="w-5 h-5" />,
    code: `# Enable HTTPS
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Create backend service (auto-start on boot)
sudo tee /etc/systemd/system/blogs4blocks.service << 'SERVICE'
[Unit]
Description=Blogs 4 Blocks Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/var/www/blogs4blocks/backend
Environment=PATH=/var/www/blogs4blocks/backend/venv/bin:/usr/bin
ExecStart=/var/www/blogs4blocks/backend/venv/bin/uvicorn server:app \\
  --host 0.0.0.0 --port 8001 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload
sudo systemctl enable blogs4blocks
sudo systemctl start blogs4blocks`,
    description: "Enable free SSL with Let's Encrypt and create a systemd service so the backend auto-starts and auto-restarts."
  },
];

export default function HostingGuidePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" data-testid="hosting-guide-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-brand-grey hover:text-[#1A1A1A]" data-testid="back-button">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Cpu className="w-6 h-6 text-[#C2544D]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-grey">Oracle Cloud + Ubuntu AMD</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-black text-[#1A1A1A]" data-testid="guide-title">Deployment Guide</h1>
          <p className="text-brand-grey mt-2">Deploy Blogs 4 Blocks on Oracle Cloud's Always Free tier — Ubuntu on an AMD micro instance.</p>
        </div>

        <div className="border border-[#2D8B7A]/30 rounded-none p-4 mb-4" style={{ background: 'linear-gradient(135deg, #E0F5EC 0%, #FDFCF8 100%)' }}>
          <p className="text-sm text-[#1A4040] font-medium flex items-center gap-2"><Zap className="w-4 h-4 text-[#2D8B7A]" /> Always Free Tier Includes</p>
          <ul className="text-sm text-[#3A5A5A] mt-1 space-y-1 list-disc ml-4">
            <li>2x AMD Micro instances (1 OCPU, 1 GB RAM each)</li>
            <li>200 GB total block storage</li>
            <li>10 TB/month outbound data transfer</li>
            <li>No credit card charges after trial — truly free forever</li>
          </ul>
        </div>

        <div className="border border-[#C4942A]/30 rounded-none p-4 mb-8" style={{ background: 'linear-gradient(135deg, #FFF8E1 0%, #FDFCF8 100%)' }}>
          <p className="text-sm text-[#92400E] font-medium flex items-center gap-2"><HardDrive className="w-4 h-4 text-[#C4942A]" /> Prerequisites</p>
          <ul className="text-sm text-[#92400E]/80 mt-1 space-y-1 list-disc ml-4">
            <li>An <a href="https://www.oracle.com/cloud/free/" target="_blank" rel="noopener noreferrer" className="underline font-medium">Oracle Cloud account</a> (free signup)</li>
            <li>A domain name pointed to your instance's public IP</li>
            <li>An SSH key pair on your local machine</li>
            <li><a href="https://www.mongodb.com/atlas" target="_blank" rel="noopener noreferrer" className="underline font-medium">MongoDB Atlas</a> free cluster (recommended over local MongoDB to save RAM)</li>
          </ul>
        </div>

        <div className="space-y-6">
          {steps.map((step, i) => (
            <div key={i} className="bg-white rounded-none border border-[#E5E5E5] overflow-hidden" data-testid={`deployment-step-${i + 1}`}>
              <div className="flex items-center gap-3 px-6 py-4 border-b border-[#F4F4F5]">
                <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-sm font-bold">{i + 1}</div>
                <div className="flex items-center gap-2 text-[#1A1A1A] font-heading font-bold">{step.icon} {step.title}</div>
              </div>
              <div className="p-6">
                <p className="text-sm text-brand-grey mb-4">{step.description}</p>
                <pre className="bg-[#1A1A1A] text-[#E5E5E5] rounded-none p-4 text-sm overflow-x-auto leading-relaxed">
                  <code>{step.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-none border border-[#E5E5E5] p-6 mt-8">
          <h3 className="font-heading font-bold text-lg text-[#1A1A1A] mb-3">After Deployment</h3>
          <ol className="space-y-2 text-sm text-brand-grey list-decimal ml-4">
            <li>Visit <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">https://yourdomain.com</code> to verify the site loads</li>
            <li>Register your account and go to <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/admin-setup</code> to become admin</li>
            <li>Check backend logs: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">sudo journalctl -u blogs4blocks -f</code></li>
          </ol>
        </div>

        <div className="bg-white rounded-none border border-[#E5E5E5] p-6 mt-4">
          <h3 className="font-heading font-bold text-lg text-[#1A1A1A] mb-3">Maintenance Commands</h3>
          <pre className="bg-[#1A1A1A] text-[#E5E5E5] rounded-none p-4 text-sm overflow-x-auto leading-relaxed">
            <code>{`# View live backend logs
sudo journalctl -u blogs4blocks -f

# Restart backend / Nginx
sudo systemctl restart blogs4blocks
sudo systemctl restart nginx

# Update code and redeploy
cd /var/www/blogs4blocks && git pull
cd backend && source venv/bin/activate && pip install -r requirements.txt
sudo systemctl restart blogs4blocks
cd ../frontend && yarn install && yarn build`}</code>
          </pre>
        </div>

        <div className="bg-white rounded-none border border-[#E5E5E5] p-6 mt-4">
          <h3 className="font-heading font-bold text-lg text-[#1A1A1A] mb-3">Troubleshooting</h3>
          <ul className="space-y-2 text-sm text-brand-grey list-disc ml-4">
            <li><strong>502 Bad Gateway:</strong> Backend isn't running — <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">sudo systemctl status blogs4blocks</code></li>
            <li><strong>Can't reach site:</strong> Check OCI Security List ingress rules and <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">sudo ufw status</code></li>
            <li><strong>WebSocket errors:</strong> Ensure Nginx config has WebSocket upgrade headers</li>
            <li><strong>CORS errors:</strong> Update CORS_ORIGINS in backend .env with your exact domain</li>
            <li><strong>Build out of memory:</strong> Add swap and/or set <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">NODE_OPTIONS=--max-old-space-size=512</code></li>
          </ul>
        </div>

        <div className="border border-[#3D6B8E]/30 rounded-none p-4 mt-4" style={{ background: 'linear-gradient(135deg, #E0F0FA 0%, #FDFCF8 100%)' }}>
          <p className="text-sm text-[#1A4040] font-medium">Performance Tips for Micro Instance</p>
          <ul className="text-sm text-[#3A5A5A] mt-1 space-y-1 list-disc ml-4">
            <li>Use <strong>MongoDB Atlas</strong> instead of local MongoDB to save ~300 MB RAM</li>
            <li>Add <strong>2 GB swap</strong> (included in Step 3)</li>
            <li>Use <strong>1 Uvicorn worker</strong> if RAM is tight (change <code className="bg-gray-100 px-1 rounded text-xs">--workers 2</code> to <code className="bg-gray-100 px-1 rounded text-xs">--workers 1</code>)</li>
            <li>Enable <strong>gzip compression</strong> in Nginx for faster page loads</li>
            <li>Monitor with <code className="bg-gray-100 px-1 rounded text-xs">free -h</code> and <code className="bg-gray-100 px-1 rounded text-xs">htop</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
