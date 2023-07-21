const path = require ('path');

const os = require ('os');

const fs = require('fs');

const resizeImg = require('resize-img');

const  { app, BrowserWindow, Menu, ipcMain, shell} = require ('electron');

const isMac = process.platform === 'darwin';

const isDev = process.env.NODE_ENV !== 'production';

let mainWindow;

//Criando Main Window

function createMainWindow() {
     mainWindow = new BrowserWindow({
        title: 'Image Resizer',
        width: isDev ? 1000 : 500,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    //Abrindo DEVTOOLS se estiver em ambiente de desenvolvedor

    if (isDev){
        mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));

}

//Criando ABOUT(SOBRE) Window

function createAboutWindow(){
    const aboutWindow = new BrowserWindow({
        title: 'About Image Resizer',
        width: 300,
        height: 300,
    });

   
    aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));

}



//APP está preparado
app.whenReady().then(()=> {
    createMainWindow();
    
//Implementando menu

    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    //Tirando janela principal da memoria quando fechado
    mainWindow.on('closed', () => (mainWindow = null))


    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0){
            createMainWindow()
        }
    });
});





//Menu template

const menu = [
    ...(isMac ? [{
        label: app.name,
        submenu: [
        {
            label: 'About',
            click: createAboutWindow
        }
        ]
    }] : [] ),
    {
        role: 'fileMenu',
    },
    ...(!isMac ? [{
        label: 'Help',
        submenu: [{
            label: 'About',
            click: createAboutWindow
        }]
    }] : [])
];

// Respondendo para o ipcRenderer resize

ipcMain.on('image:resize', (e, options) => { 
    options.dest = path.join(os.homedir(), 'imageresizer')
    resizeImage(options);
});

//Fazendo RESIZE da imagem

async function resizeImage({ imgPath, width, height, dest }){
    try {
        const newPath = await resizeImg(fs.readFileSync(imgPath), {
            width: +width,
            height: +height
        })

        //criando o filename(nome do arquivo)
        const filename = path.basename(imgPath);

        //criando pasta para destino se não existir

        if(!fs.existsSync(dest)){
            fs.mkdirSync(dest);
        }

        //Escrevendo arquivo no destino

        fs.writeFileSync(path.join(dest, filename), newPath);

        //Mandando mensagem de sucesso para render

        mainWindow.webContents.send('image:done');

        //Abrindo pasta do arquivo

        shell.openPath(dest);

    } catch (error) {
        console.log(error);
    }
}

app.on('window-all-closed', () => {
    if (!isMac) 
    app.quit()
  })
    
