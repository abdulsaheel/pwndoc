import io from 'socket.io-client'
import { Loading } from 'quasar'
import { $t } from '@/boot/i18n'

export default ({ Vue }) => {
    var socketUrl = "https://127.0.0.1:4242";
    var socket = io(socketUrl);

    socket.on('disconnect', (error) => {
        Loading.show({
            message: `<i class='material-icons'>wifi_off</i><br /><p>${$t('msg.wrongContactingBackend')}</p>`, 
            spinner: null, 
            backgroundColor: 'red-10', 
            customClass: 'loading-error',
            delay: 5000
        })
    })

    socket.on('connect', () => {    
        Loading.hide()
    })

    Vue.prototype.$socket = socket
}
