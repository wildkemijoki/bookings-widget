#bash
git pull
rm -rf node_modules package-lock.json
npm install
npm run build
cd dist
rm -rf booking-widget.es*
mv vite-react-typescript-starter.css booking-widget.css
gzip -k booking-widget.umd.js.map
gzip -k booking-widget.umd.js
rm booking-widget.umd.js
rm booking-widget.umd.js.map
mv -f * /www/hosting/wildkemijoki.cz/bookings/widget
chown -R www-data:www-data /www/hosting/wildkemijoki.cz/bookings/widget
echo "Done"
