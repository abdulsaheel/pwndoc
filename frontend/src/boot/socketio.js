import io from 'socket.io-client'
import { Loading } from 'quasar'
import { $t } from '@/boot/i18n'

export default ({ Vue }) => {
    // Construct the socket URL with a fixed port of 4242
    var socketUrl = `${window.location.protocol}//${window.location.hostname}:4242`;

    // Initialize the socket connection
    var socket = io(socketUrl);

    // Handle disconnect event
    socket.on('disconnect', (error) => {
        Loading.show({
            message: `<i class='material-icons'>wifi_off</i><br /><p>${$t('msg.wrongContactingBackend')}</p>`, 
            spinner: null, 
            backgroundColor: 'red-10', 
            customClass: 'loading-error',
            delay: 5000
        });
    });

    // Handle connect event
    socket.on('connect', () => {    
        Loading.hide();
    });

    // Add the socket instance to Vue prototype
    Vue.prototype.$socket = socket;
};
