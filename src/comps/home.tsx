import React, { useEffect, useRef, useState } from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import Link from '@material-ui/core/Link';
import {
  AppBar,
  Badge,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogProps,
  DialogTitle,
  Drawer,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  MenuProps,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Tooltip,
  FormControl,
  InputAdornment,
  Grid,
  Chip,
  Stepper,
  Step,
  StepLabel,
  ListItemIcon,
  Avatar,
  ListItemAvatar,
  Backdrop,
  CircularProgress,
} from '@material-ui/core';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import RefreshIcon from '@material-ui/icons/Refresh';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import AttachmentIcon from '@material-ui/icons/Attachment';
import TuneIcon from '@material-ui/icons/Tune';
import AddIcon from '@material-ui/icons/Add';
import CheckIcon from '@material-ui/icons/Check';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import FingerprintIcon from '@material-ui/icons/Fingerprint';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import DeveloperBoardIcon from '@material-ui/icons/DeveloperBoard';
import { observer, inject } from 'mobx-react';
import { Device, DeviceStore, InitSeqConfigItem } from '@/store';
import { autorun } from 'mobx';
import moment from 'moment';
import { useSnackbar } from 'notistack';
import { Field, FieldArray, Form, Formik } from 'formik';
import { TextField, Select } from 'formik-material-ui';
import * as yup from 'yup';
import { DeviceType } from '@/store';
import { amber, lightGreen, red } from '@material-ui/core/colors';
import { random, sample } from 'lodash';
import Typewriter from 'typewriter-effect';
import { Autorenew, Send } from '@material-ui/icons';
import XLSX from 'xlsx';
import { remote, shell } from 'electron';
import { storeAnnotation } from 'mobx/dist/internal';
import confMan from '@/conf_man';
import ComService from '@/com_service';
import { delay } from '@/utilities'

import { DictDialog, InitSeqDialog, ComDialog, ScanMan } from '@/comps';
import zIndex from '@material-ui/core/styles/zIndex';

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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);
  const [code, setCode] = useState<string | null>(null);

  const { enqueueSnackbar } = useSnackbar();

  const [isOpen, setOpen] = useState({
    dictDialog: false,
    initSeqDialog: false,
    comDialog: false,
    backdrop: false,
  });


  const configMenu = (
    <Menu
      anchorEl={anchorEl}
      classes={{
        list: classes.configMenu,
      }}
      keepMounted
      open={isMenuOpen}
      onClose={() => {
        setAnchorEl(null);
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
        deviceStore.setAutoAuth(!deviceStore.autoAuth);
      }}>
        <ListItemText primary="自动授权" />
        <ListItemSecondaryAction style={{pointerEvents: 'none'}}>
          <Switch checked={deviceStore.autoAuth} onChange={e => {
            deviceStore.setAutoAuth(e.target.checked);
          }}/>
        </ListItemSecondaryAction>
      </MenuItem>
      <MenuItem onClick={() => {
        setAnchorEl(null);
        //TODO: 打开设置窗口
        setOpen({...isOpen, dictDialog: true});
      }}>
        <ListItemText primary="数据字典" />
      </MenuItem>
      <MenuItem onClick={() => {
        setAnchorEl(null);
        //TODO: 打开设置窗口
        setOpen({...isOpen, initSeqDialog: true});
      }}>
        <ListItemText primary="初始化序列" />
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
              onClick={() => {
                setOpen({...isOpen, comDialog: true});
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
              setAnchorEl(e.currentTarget);
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
              comService.connect(path, baudrate)
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
                code == null ? (
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
                    <Chip color='primary' icon={<CheckIcon />} label={code} size='small'/>
                  </Tooltip>
                ) : (
                  <Tooltip title="数据字典中未匹配到此设备" arrow>
                    <Chip color='secondary' icon={<ErrorOutlineIcon />} label={code} size='small'/>
                  </Tooltip>
                )
              }
            </div>

            <Stepper classes={{'root': classes.stepper}}>
              <Step>
                <StepLabel>
                  扫描设备
                </StepLabel>
              </Step>
              <Step>
                <StepLabel>
                  步骤2
                </StepLabel>
              </Step>
              <Step>
                <StepLabel>
                  步骤3
                </StepLabel>
              </Step>
            </Stepper>

            <ScanMan onScan={value => {
              setCode(value);
              deviceStore.selectCurrentDevice(value);
            }} />

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
        </div>
      </div>
    </div>
  );
}))
