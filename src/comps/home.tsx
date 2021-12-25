import React, { useEffect, useRef, useState } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Link from '@material-ui/core/Link';
import {
  AppBar,
  Badge,
  IconButton,
  ListItemSecondaryAction,
  ListItemText,
  Menu,
  MenuItem,
  Switch,
  Toolbar,
  Tooltip,
  Grid,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Backdrop,
  CircularProgress,
  ListItemIcon,
} from '@material-ui/core';
import TuneIcon from '@material-ui/icons/Tune';
import CheckIcon from '@material-ui/icons/Check';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import FingerprintIcon from '@material-ui/icons/Fingerprint';
import LinkOffIcon from '@material-ui/icons/LinkOff';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import DeveloperBoardIcon from '@material-ui/icons/DeveloperBoard';
import { observer, inject } from 'mobx-react';
import { DeviceStore } from '@/store';
import { useSnackbar } from 'notistack';
import { mapValues } from 'lodash';
import Typewriter from 'typewriter-effect';
import { Autorenew, Send } from '@material-ui/icons';
import confMan from '@/conf_man';
import ComService from '@/com_service';
import { delay, avoidReenter, assets } from '@/utilities'
import { DictDialog, InitSeqDialog, ComDialog, ScanMan } from '@/comps';
import { red } from '@material-ui/core/colors';
import {play, Voice} from '@/utilities/voice';


function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary">
      {'Copyright © '}
      <Link color="inherit" href="https://www.fzstack.com/">
        fzstack
      </Link>{' '}
      {new Date().getFullYear()}.
    </Typography>
  );
}


type DeviceMenuEvents = 'reset' | 'sample' | 'factory' | 'uploadThr' | 'moniTime';

const drawerWidth = '30vw';
const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    //overflow: 'hidden',
  },
  main: {
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(2),
    flex: '1',
    height: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  table: {
    marginBottom: theme.spacing(2),
  },
  footer: {
    padding: theme.spacing(3, 2),
    marginTop: 'auto',
    backgroundColor:
      theme.palette.type === 'light'
        ? theme.palette.grey[200]
        : theme.palette.grey[800],
  },
  appbar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  toolbar: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  drawer: {
    width: drawerWidth,
  },
  drawerPaper: {
    width: drawerWidth,
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  },
  textField: {
    flex: '1'
  },
  menuButton: {
    marginRight: theme.spacing(1),
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1',
  },
  sideHolder: {
    display: 'flex',
    flexDirection: 'row',
    flex: '1',
  },
  msgList: {
    flex: 1,
    //maxHeight: 100,
    overflow: 'auto',
    //overflowX: 'hidden',
    width: '100%',
  },
  msgListHeader: {
    background: 'rgba(255,255,255,0.9)',
  },
  inline: {
    wordWrap: 'break-word',
    wordBreak: 'break-all',
  },
  footerRow: {
    //width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  configMenu: {
    width: '170px',
  },
  comDevMenu: {
    minWidth: '130px',
  },
  footerStatus: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: 2,
    color: '#7cb342',
  },
  caption: {
    fontSize: '4em',
  },
  captionCursor: {
    fontSize: '5em',
    animation: 'Typewriter-cursor 1s infinite',
  },
  devState: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepper: {
    width: '100%',
    flex: '1',
    backgroundColor: 'transparent',
  },
  commitButton: {
    alignSelf: 'flex-end',
    marginRight: '16px',
    marginBottom: '32px',
  },
  statusBadget: ({isOnline}: {isOnline: boolean}) => ({
    transform: 'translate(4px, -1px) scale(0.8, 0.8)',
    backgroundColor: isOnline ? "#7cb342" : "#d32f2f",
  })
}));

type HomeProps = {
  deviceStore: DeviceStore;
  comService: ComService;
}

export default inject("deviceStore", "comService")(observer(({deviceStore, comService}: HomeProps) => {
  const classes = useStyles({isOnline: deviceStore.online});
  const [anchorEl, setAnchorEl] = useState({
    config: null as (HTMLElement | null),
    comDev: null as (HTMLElement | null),
  });
  const isMenuOpen = mapValues(anchorEl, v => Boolean(v));

  const [displayCode, setDisplayCode] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const [activeStep, setActiveStep] = useState(0);

  const [isOpen, setOpen] = useState({
    dictDialog: false,
    initSeqDialog: false,
    comDialog: false,
    backdrop: false,
  });

  useEffect(() => {
    let voice: Voice;
    switch(activeStep) {
      case 0:
        voice = 'wait_qrcode_scan';
        break;
      case 1:
        voice = 'wait_insert_power';
        break;
      case 2:
        voice = 'device_configurating';
        break;
      case 3:
        voice = 'device_self_testing';
        break;
      case 4:
        voice = 'devce_ready';
        break;
      default:
        return;
    }

    play(voice);
  }, [activeStep]);


  const configMenu = (
    <Menu
      anchorEl={anchorEl.config}
      classes={{
        list: classes.configMenu,
      }}
      keepMounted
      open={isMenuOpen.config}
      onClose={() => {
        setAnchorEl(a => ({...a, config: null}));
      }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      getContentAnchorEl={null}
    >
      <MenuItem onClick={() => {
        setAnchorEl(a => ({...a, config: null}));
        //TODO: 打开设置窗口
        setOpen({...isOpen, dictDialog: true});
      }}>
        <ListItemText primary="数据字典" />
      </MenuItem>
      <MenuItem onClick={() => {
        setAnchorEl(a => ({...a, config: null}));
        //TODO: 打开设置窗口
        setOpen({...isOpen, initSeqDialog: true});
      }}>
        <ListItemText primary="初始化序列" />
      </MenuItem>
    </Menu>
  );

  const comDevMenu = (
    <Menu
      anchorEl={anchorEl.comDev}
      open={isMenuOpen.comDev}
      classes={{
        list: classes.comDevMenu,
      }}
      keepMounted
      onClose={() => {
        setAnchorEl(a => ({...a, comDev: null}));
      }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      getContentAnchorEl={null}
    >
      <MenuItem dense disabled>
        <ListItemText primary={deviceStore.devPath} />
        <ListItemSecondaryAction>
          <Tooltip title="断开连接" arrow>
            <IconButton size='small' onClick={() => {
              comService.disconnect();
              setAnchorEl(a => ({...a, comDev: null}));
              enqueueSnackbar(`已断开与${deviceStore.devPath}的连接`, {
                variant: 'warning',
                anchorOrigin: {vertical: 'bottom', horizontal: 'right'},
              });
            }}>
              <LinkOffIcon fontSize="small" color='error' />
            </IconButton>
          </Tooltip>
        </ListItemSecondaryAction>
      </MenuItem>
    </Menu>
  );

  return (
    <div className={classes.root}>
      <CssBaseline />
      <Backdrop style={{zIndex: 9999}} open={isOpen.backdrop}>
        <CircularProgress />
      </Backdrop>
      <AppBar position="static" className={classes.appbar}>
        <Toolbar variant='dense' className={classes.toolbar}>
          <IconButton
              edge="start"
              className={classes.menuButton}
              color="inherit"
              onClick={e => {
                if(deviceStore.online) {
                  setAnchorEl(a => ({...a, comDev: e.currentTarget}));
                } else {
                  setOpen({...isOpen, comDialog: true});
                }
              }}
            >
              <Badge variant="dot" classes={{
                badge: classes.statusBadget,
              }}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              >
                <Tooltip title={`上位机 - ${deviceStore.online ? "在线" : "离线"}`} arrow>
                  <DeveloperBoardIcon />
                </Tooltip>
              </Badge>
          </IconButton>
          <IconButton
            edge="start"
            className={classes.menuButton}
            color="inherit"
            aria-label="menu"
            onClick={e => {
              setAnchorEl(a => ({...a, config: e.currentTarget}));
            }}
          >
            <Tooltip title="设置" arrow>
              <TuneIcon />
            </Tooltip>
          </IconButton>
        </Toolbar>
      </AppBar>
      <DictDialog
        open={isOpen.dictDialog}
        onClose={() => {
          setOpen({...isOpen, dictDialog: false});
        }}
        onSubmit={path => {
          confMan.set('dataDictPath', path);
          setOpen({...isOpen, dictDialog: false});
          enqueueSnackbar(`数据字典加载成功, 共${deviceStore.dataDictItems.length}项`, {
            variant: 'success',
            anchorOrigin: {vertical: 'bottom', horizontal: 'right'},
          });
        }}
        onCancel={() => {
          setOpen({...isOpen, dictDialog: false});
        }}
      />
      <InitSeqDialog
        open={isOpen.initSeqDialog}
        onSubmit={() => {
          setOpen({...isOpen, initSeqDialog: false});
        }}
        onClose={() => {
          setOpen({...isOpen, initSeqDialog: false});
        }}
        onCancel={() => {
          setOpen({...isOpen, initSeqDialog: false});
        }}
        store={deviceStore}
      />
      <ComDialog
        open={isOpen.comDialog}
        onSubmit={async ({path, baudrate}) =>{
          console.log({path, baudrate});
          setOpen(o => ({...o, backdrop: true, comDialog: false}));
          try {
            await Promise.all([
              delay(500),
              (async() => {
                await comService.connect(path, baudrate);
                await comService.configUplink(deviceStore.currentSelectedItem?.seq.map(e => e.cmd) ?? []);
              })(),
            ]);

            enqueueSnackbar(`${path}连接成功`, {
              variant: 'success',
              anchorOrigin: {vertical: 'bottom', horizontal: 'right'},
            });
          } catch {
            enqueueSnackbar(`${path}连接失败`, {
              variant: 'error',
              anchorOrigin: {vertical: 'bottom', horizontal: 'right'},
            });
          } finally {
            setOpen(o => ({...o, backdrop: false}));
          }
        }}
        onClose={() => {
          setOpen({...isOpen, comDialog: false});
        }}
        onCancel={() => {
          setOpen({...isOpen, comDialog: false});
        }}
      />
      <div className={classes.sideHolder}>
        <div className={classes.content}>
          <Container component="main" maxWidth="sm" className={classes.main}>
            {/* <h1 style={{'textAlign': 'center'}}>地灾设备编码检测</h1> */}
            <Typewriter
              options={{
                wrapperClassName: classes.caption,
                cursorClassName: classes.captionCursor,
              }}
              onInit={(writer) => {
                writer
                  .pauseFor(1000)
                  .typeString('地灾')
                  .pauseFor(500)
                  .typeString('·')
                  .pauseFor(700)
                  .typeString('设备编码检测')
                  .start();
              }}
            />

            <div className={classes.devState}>
              <div style={{paddingRight: '8px'}}>
                设备:
              </div>
              {
                displayCode == null ? (
                  <Chip icon={<Autorenew />} label='请扫描' size='small'/>
                ) : deviceStore.currentSelectedDevice != null ? (
                  <Tooltip title={
                    <>
                      <Grid
                        container
                        spacing={0}
                        justify='flex-start'
                        alignItems='center'
                      >
                        <Grid item xs={2}>
                          <FingerprintIcon />
                        </Grid>
                        <Grid item xs={10}>
                          <Typography variant='caption'>
                            {deviceStore.currentSelectedDevice?.did}
                          </Typography>
                        </Grid>
                      </Grid>
                      <Grid
                        container
                        spacing={0}
                        justify='flex-start'
                        alignItems='center'
                      >
                        <Grid item xs={2}>
                        <VpnKeyIcon />
                        </Grid>
                        <Grid item xs={10}>
                          <Typography variant='caption' noWrap>
                            {deviceStore.currentSelectedDevice?.key}
                          </Typography>
                        </Grid>
                      </Grid>
                    </>
                  } arrow>
                    <Chip color='primary' icon={<CheckIcon />} label={displayCode} size='small'/>
                  </Tooltip>
                ) : (
                  <Tooltip title="数据字典中未匹配到此设备" arrow>
                    <Chip color='secondary' icon={<ErrorOutlineIcon />} label={displayCode} size='small'/>
                  </Tooltip>
                )
              }
            </div>

            <Stepper classes={{'root': classes.stepper}} activeStep={activeStep}>
              <Step>
                <StepLabel>
                  扫描二维码
                </StepLabel>
              </Step>
              <Step>
                <StepLabel>
                  接入设备
                </StepLabel>
              </Step>
              <Step>
                <StepLabel>
                  配置设备
                </StepLabel>
              </Step>
              <Step>
                <StepLabel>
                  设备自检
                </StepLabel>
              </Step>
            </Stepper>

            <ScanMan onScan={avoidReenter(async (value: string) => {
              console.debug('scan func called');
              setDisplayCode(value);
              deviceStore.selectCurrentDevice(value);
              const currentDev = deviceStore.currentSelectedDevice;
              if(currentDev != null) {
                setActiveStep(s => s == 0 ? 1 : s);
                //TODO: 等待, 禁止重入
                await comService.waitDev(); //发送完这个之后
                setActiveStep(2);
                await comService.geoCommand('set_device_sn', {
                  device_sn: currentDev.sn,
                });
                await comService.geoCommand('set_id_apikey', {
                  id: currentDev.did,
                  apikey: currentDev.key,
                });
                setActiveStep(3);
                let succCount = 0;
                while(true) {
                  const frame = await comService.readGeoFrame();
                  if(frame.type == 'prop') {
                    for(const k in frame.data) {
                      if(k == currentDev.did) {
                        console.debug('did matched');
                        const items = frame.data[k];
                        for(const itemName in items) {
                          const seqData = items[itemName];
                          for(const date in seqData) {
                            const record = seqData[date];
                            switch(currentDev.sn.slice(0, 2)) {
                              case 'LF':
                                if('X' in record && 'Y' in record) {
                                  console.debug('is LF!');
                                  if(Math.abs(record.X) < 2 && Math.abs(record.Y) < 2) {
                                    succCount++;
                                    console.debug('checked!');
                                  }
                                }
                                break;
                            }
                            console.debug({record});
                          }
                        }
                      }
                    }

                    if(succCount > 0) {
                      break;
                    }
                  }
                }

                console.debug('done');
                setActiveStep(4);
              } else {
                play('invalid_qrcode');
                setActiveStep(s => s == 1 ? 0 : s);
              }
            })} />

            {/* <Button variant="contained" endIcon={<Send />} className={classes.commitButton} onClick={() => {

            }}>
              提交
            </Button> */}
          </Container>
          <footer className={classes.footer}>
            <Container maxWidth="md" className={classes.footerRow}>
              <div>
                <Typography variant="body1">
                  福建省地质工程勘察院
                </Typography>
                <Typography variant="body1">
                  自然资源部丘陵山地地质灾害防治重点实验室
                </Typography>
                <Copyright />
              </div>
            </Container>
          </footer>
          {configMenu}
          {comDevMenu}
        </div>
      </div>
    </div>
  );
}))
