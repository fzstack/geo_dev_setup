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
} from '@material-ui/core';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import RefreshIcon from '@material-ui/icons/Refresh';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import TuneIcon from '@material-ui/icons/Tune';
import { observer, inject } from 'mobx-react';
import { Device, DeviceStore } from '@/store';
import { autorun } from 'mobx';
import moment from 'moment';
import { useSnackbar } from 'notistack';
import { Field, FieldArray, Form, Formik } from 'formik';
import { TextField, Select } from 'formik-material-ui';
import * as yup from 'yup';
import { DeviceType } from '@/store';
import { red } from '@material-ui/core/colors';
import { random, sample } from 'lodash';

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

function nullComp<T>(a: T | undefined, b: T | undefined, comp: (a: T, b: T) => number): number {
  if(a != null && b != null) {
    return comp(a, b);
  } else if(a != null && b == null) {
    return 1;
  } else if(a == null && b != null) {
    return -1;
  } else {
    return 0;
  }
}

function gComp<T>(a: T, b: T): number {
  return a == b ? 0 : (a < b ? -1 : 1);
}

type pos = {
  x: number | null,
  y: number | null,
}

const defualtPos: pos = {
  x: null,
  y: null,
};

type DeviceMenuEvents = 'reset' | 'sample' | 'factory' | 'uploadThr' | 'moniTime';

type DeviceMenuProps = {
  currPos: pos,
  title: string,
  onClick: (e: DeviceMenuEvents) => void;
  type: DeviceType,
};

function DeviceMenu({currPos, title, onClick, type, ...props}: DeviceMenuProps & Omit<MenuProps, 'onClick' | 'open'>) {
  return (
    <Menu
      anchorReference="anchorPosition"
      anchorPosition={currPos.x != null && currPos.y != null ? {
        top: currPos.y,
        left: currPos.x,
      } : undefined}
      open={currPos.x != null}
      {...props}
    >
      <MenuItem dense disabled>{title}</MenuItem>
      <MenuItem onClick={() => onClick('reset')}>复位初值</MenuItem>
      {type != DeviceType.WG &&
        [
          <MenuItem key='sample' onClick={() => onClick('sample')}>实时采集</MenuItem>,
          <MenuItem key='uploadThr' onClick={() => onClick('uploadThr')}>设置上报时间</MenuItem>
        ]
      }
      {type == DeviceType.WG &&
        <MenuItem onClick={() => onClick('moniTime')}>设置监测等级</MenuItem>
      }
      <MenuItem onClick={() => onClick('factory')} style={{color: red[500]}}>恢复出厂设置</MenuItem>
    </Menu>
  );
}

type DeviceUploadDurDialogProps = {
  onSubmit: (values: {duration: number}) => void,
  onCancel: () => void;
};

function DeviceUploadDurDialog({onSubmit, onCancel, ...props}: Partial<DeviceUploadDurDialogProps> & Omit<DialogProps, 'onSubmit'>) {
  return (
    <Dialog {...props}>
      <Formik
        initialValues={{
          duration: 10,
        }}
        validationSchema={yup.object({
          duration: yup.number().min(10, '至少10秒').required("必须字段"),
        })}
        onSubmit={values => {
          onSubmit?.(values);
        }}
      >
        {({submitForm}) => (
          <>
            <DialogTitle>
            设置上报时间
            </DialogTitle>
            <DialogContent>
              <Form>
                <Field
                  component={TextField}
                  name="duration"
                  type="number"
                  label="上报周期(s)"
                  autoFocus
                  margin="dense"
                  fullWidth
                />
              </Form>
            </DialogContent>
            <DialogActions>
              <Button onClick={onCancel}>
                取消
              </Button>
              <Button color='primary' type="submit" onClick={submitForm}>
                提交
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </Dialog>
  );
}

type DeviceMoniTimeDialogProps = {
  onSubmit: (values: {moniDurs: number[]}) => void,
  onCancel: () => void;
};

function DeviceMoniTimeDialog({onSubmit, onCancel, ...props}: Partial<DeviceMoniTimeDialogProps> & Omit<DialogProps, 'onSubmit'>) {
  return (
    <Dialog {...props}>
      <Formik
        initialValues={{
          moniDurs: Array<number>(5).fill(10),
        }}
        validationSchema={yup.object({
          moniDurs: yup.array(yup.lazy((_, options: any) => yup.number().min(10, '至少10秒').required(`请输入监测周期${options.index}`))),
        })}
        onSubmit={values => {
          onSubmit?.(values);
        }}
      >
        {({submitForm, values: {moniDurs}}) => (
          <>
            <DialogTitle>
              设置上报时间
            </DialogTitle>
            <DialogContent>
              <Form>
                <FieldArray
                  name="moniDurs"
                >
                  {() => (
                    <>
                      {moniDurs.map((_, i) => (
                        <Field
                          key={i}
                          component={TextField}
                          name={`moniDurs.${i}`}
                          type="number" 
                          label={`等级${i}监测周期(s)`}
                          margin="dense"
                          fullWidth
                        />
                      ))}
                    </>
                  )}
                </FieldArray>
              </Form>
            </DialogContent>
            <DialogActions>
              <Button onClick={onCancel}>
                取消
              </Button>
              <Button color='primary' type="submit" onClick={submitForm}>
                提交
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </Dialog>
  );
}

function DeviceRow({device}: {device: Device}) {
  const { enqueueSnackbar } = useSnackbar();
  const [currPos, setCurrPos] = useState(defualtPos);
  const rootRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    device.on('auth', () => {
      enqueueSnackbar(`${device.sn}授权成功`, {
        variant: 'success',
        anchorOrigin: {vertical: 'bottom', horizontal: 'right'},
      });
    })
    rootRef.current?.addEventListener('contextmenu', e => {
      e.preventDefault();
      setCurrPos({
        x: e.clientX - 2,
        y: e.clientY - 4,
      })
    });
  }, []);

  const success = (msg: string) => enqueueSnackbar(msg, {
    variant: 'success',
    anchorOrigin: {vertical: 'bottom', horizontal: 'right'},
  });

  const [isOpen, setOpen] = useState({uploadDur: false, moniTime: false});
  const closeMenuAfter = <F extends (...args: any) => Promise<[string, string] | string | null>>(f: F) => async (...args: any) => {
    const result = await f(...args);
    setCurrPos(defualtPos);
    let msg: string | null = null;
    if(Array.isArray(result)) {
      msg = `${result[0]}${device.sn}${result[1]}`;
    } else if(typeof result == 'string') {
      msg = `${device.sn}${result}`;
    }
    if(msg != null) {
      success(msg);
    }
  }

  return (
    <>
      <TableRow hover ref={rootRef} style={{
        cursor: 'context-menu',
      }}>
        <TableCell align='center'>{device.sn}</TableCell>
        <TableCell align='center'> {device.id}</TableCell>
        <TableCell align='center'>{device.gateway}</TableCell>
        <TableCell align='center'>{JSON.stringify(device.value) ?? '-'}</TableCell>
        <TableCell align='center'>{device.authState ? "已授权" : "未授权"}</TableCell>
        <TableCell align='center'>{(device.authTime == null ? null : moment(device.authTime).format('YYYY/MM/DD HH:mm:ss')) ?? '-'}</TableCell>
      </TableRow>
      <DeviceMenu
        title={`${device.id} - 命令`}
        type={device.type}
        currPos={currPos}
        onClose={() => setCurrPos(defualtPos)}
        onClick={closeMenuAfter(async e => {
          switch(e) {
            case 'reset':
              await device.reset();
              return '复位成功';
            case 'sample':
              await device.sample();
              return ['已向', '发送采样命令'];
            case 'factory':
              await device.factory();
              return '恢复出厂设置成功';
            case 'uploadThr':
              setOpen({...isOpen, uploadDur: true});
              break;
            case 'moniTime':
              setOpen({...isOpen, moniTime: true});
              break;
          }
          return null;
        })}
      />
      <DeviceUploadDurDialog
        open={isOpen.uploadDur}
        onClose={() => setOpen({...isOpen, uploadDur: false})}
        onSubmit={async ({duration}) => {
          await device.setUploadDuration(duration);
          success(`${device.sn}上传周期已设为${duration}秒`);
          setOpen({...isOpen, uploadDur: false});
        }}
        onCancel={() => setOpen({...isOpen, uploadDur: false})}
      />
      <DeviceMoniTimeDialog
        open={isOpen.moniTime}
        onClose={() => setOpen({...isOpen, moniTime: false})}
        onSubmit={async ({moniDurs}) => {
          await device.setMoniTime(moniDurs);
          success(`${device.sn}设置监测周期成功`);
          setOpen({...isOpen, moniTime: false});
        }}
        onCancel={() => setOpen({...isOpen, moniTime: false})}
      />
    </>
  )
}

const useVdevDialogStyle = makeStyles(theme => ({
  button: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
  }
}));

type VirtualDeviceDialogProps = {
  onSubmit: (values: {id: string, gateway: string}) => void,
  onCancel: () => void;
};

function VirtualDeviceDialog({onSubmit, onCancel, ...props}: Partial<VirtualDeviceDialogProps> & Omit<DialogProps, 'onSubmit'>) {
  const classes = useVdevDialogStyle();
  const genRandom = () => ({
    deviceType: sample(Object.values(DeviceType).filter(e => typeof e == 'number')) as number,
    idSuffix: random(1000, 9999),
    gatewaySuffix: random(1000, 9999),
  })

  return (
    <Dialog {...props}>
      <Formik
        initialValues={genRandom()}
        validationSchema={yup.object({
          deviceType: yup.number().required(),
          idSuffix: yup.number().integer("必须是整数").min(1000, 'id后缀须为4位数').max(9999, 'id后缀须为4位数').required('id后缀不能为空'),
          gatewaySuffix: yup.number().integer("必须是整数").min(1000, '网关须为4位数').max(9999, '网关须为4位数').required('网关不能为空'),
        })}
        onSubmit={({deviceType, idSuffix, gatewaySuffix}) => {
          onSubmit?.({
            id: `${deviceType.toString().padStart(2, '0')}${idSuffix.toString().padStart(4, '0')}`,
            gateway: `MAC${gatewaySuffix.toString().padStart(4, '0')}`,
          })
        }}
      >
        {({submitForm, setValues}) => (
          <>
            <MuiDialogTitle disableTypography >
              <Typography variant="h6">添加虚拟设备</Typography>
              <IconButton className={classes.button} onClick={() => {
                setValues(genRandom());
              }}>
                <RefreshIcon />
              </IconButton>
            </MuiDialogTitle>
            <DialogContent>
              <Form>
                <FormControl fullWidth margin="dense">
                  <InputLabel id="demo-simple-select-label">设备类型</InputLabel>
                  <Field
                    component={Select}
                    name="deviceType"
                  >
                    <MenuItem value={DeviceType.WG}>网关</MenuItem>
                    <MenuItem value={DeviceType.QJ}>倾角</MenuItem>
                    <MenuItem value={DeviceType.LF}>裂缝</MenuItem>
                    <MenuItem value={DeviceType.YL}>雨量</MenuItem>
                  </Field>
                </FormControl>
                <Field
                  component={TextField}
                  name="idSuffix"
                  type="number"
                  label="id后缀"
                  margin="dense"
                  fullWidth
                />
                <Field
                  component={TextField}
                  name="gatewaySuffix"
                  type="number"
                  label="网关"
                  margin="dense"
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start" style={{marginBottom: '4px'}}>MAC</InputAdornment>,
                  }}
                />
              </Form>
            </DialogContent>
            <DialogActions>
              <Button onClick={onCancel}>
                取消
              </Button>
              <Button color='primary' type="submit" onClick={submitForm}>
                添加
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </Dialog>
  );
}

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
  statusBadget: ({isOnline}: {isOnline: boolean}) => ({
    transform: 'translate(4px, -1px) scale(0.8, 0.8)',
    backgroundColor: isOnline ? "#7cb342" : "#d32f2f",
  })
}));

export default inject("deviceStore")(observer(({deviceStore}: {deviceStore: DeviceStore}) => {
  const classes = useStyles({isOnline: deviceStore.online});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const { enqueueSnackbar } = useSnackbar();

  const [isOpen, setOpen] = useState({vdevDialog: false});

  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    autorun(() => {
      const len = deviceStore.origins.length;
      const curr = listRef.current;
      if(curr == null) return;
      if(curr.scrollTop + curr.clientHeight + 200 >= curr.scrollHeight) {
        curr.scrollTop = curr.scrollHeight;
      }

    });
  }, []);

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
        setOpen({...isOpen, vdevDialog: true});
      }}>
        <ListItemText primary="添加虚拟设备" />
      </MenuItem>
    </Menu>
  );

  return (
    <div className={classes.root}>
      <CssBaseline />
      <AppBar position="static" className={classes.appbar}>
        <Toolbar variant='dense' className={classes.toolbar}>
          <IconButton
              edge="start"
              className={classes.menuButton}
              color="inherit"
            >
              <Badge variant="dot" classes={{
                badge: classes.statusBadget,
              }}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              >
                <Tooltip title={`用户 - ${deviceStore.online ? "在线" : "离线"}`} arrow>
                  <AccountCircleIcon />
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
      <Drawer
        variant='persistent'
        anchor='left'
        open
        className={classes.drawer}
        classes={{
          paper: classes.drawerPaper,
        }}
      >
        <Toolbar />
        <List ref={listRef} subheader={<ListSubheader className={classes.msgListHeader}>MQTT消息</ListSubheader>} className={classes.msgList}>
          {
            deviceStore.origins.map(msg =>
              <ListItem key={msg.id} button dense>
                <ListItemText primary={msg.topic} secondary={
                  <>
                    <Typography component="span" variant='body2' className={classes.inline}>
                      {msg.payload}
                    </Typography>
                  </>
                }/>
              </ListItem>
            )
          }
        </List>
      </Drawer>
      <VirtualDeviceDialog
        open={isOpen.vdevDialog}
        onClose={() => {
          setOpen({...isOpen, vdevDialog: false});
        }}
        onSubmit={({id, gateway}) => {
          const device = deviceStore.addDevice(id, gateway);
          enqueueSnackbar(`${device.sn}创建成功`, {
            variant: 'success',
            anchorOrigin: {vertical: 'bottom', horizontal: 'right'},
          });
          setOpen({...isOpen, vdevDialog: false});
        }}
        onCancel={() => {
          setOpen({...isOpen, vdevDialog: false});
        }}
      />
      <div className={classes.sideHolder}>
        <div className={classes.drawer}/>
        <div className={classes.content}>
          <Container component="main" maxWidth="md" className={classes.main}>
            <TableContainer component={Paper} className={classes.table}>
              <Table aria-label="simple table" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell align='center'>序列号</TableCell>
                    <TableCell align='center'>设备号</TableCell>
                    <TableCell align='center'>网关</TableCell>
                    <TableCell align='center'>当前值</TableCell>
                    <TableCell align='center'>授权状态</TableCell>
                    <TableCell align='center'>授权时间</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deviceStore.devices.slice().sort((a, b) => {
                    const idOrder = nullComp(a.id, b.id, gComp);
                    const gatewayOrder = nullComp(a.gateway, b.gateway, gComp);
                    if(gatewayOrder != 0)
                      return gatewayOrder;
                    return idOrder;
                  }).map((device) => (
                      <DeviceRow key={device.id} device={device} />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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
