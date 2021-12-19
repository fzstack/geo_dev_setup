import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogProps, DialogTitle, FormControl, InputLabel, ListItemText, makeStyles, MenuItem, Typography } from "@material-ui/core";
import { Field, Form, Formik } from "formik";
import { Select } from "formik-material-ui";
import * as yup from 'yup';

const SerialPort = window.require('serialport');
import { PortInfo } from "serialport";

const useStyle = makeStyles(theme => ({
  root: {
    minWidth: 300,
  },
  paper: {
    maxHeight: 96 * 3.5,
  },
  itemCon: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  item: {

  }
}));

type DeviceMoniTimeDialogProps = {
  onSubmit: (values: {baudrate: number, path: string}) => void,
  onCancel: () => void;
};

export default function({onSubmit, onCancel, ...props}: Partial<DeviceMoniTimeDialogProps> & Omit<DialogProps, 'onSubmit'>) {
  const classes = useStyle();
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [defaultPort, setDefaultPort] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      const ports = await SerialPort.list();
      setPorts(ports);
      setDefaultPort(ports.filter((e: PortInfo) => e.manufacturer == 'wch.cn')?.[0]?.path);
    })();
  }, []);
  return (
    <Dialog classes={{paper: classes.root}} {...props}>
      {
        ports.length == 0 ? '未查找到有效的串口设备' : (
          <Formik
            initialValues={{
              baudrate: 9600,
              path: defaultPort!,
            }}
            validationSchema={yup.object({
              path: yup.string().required(),
              baudrate: yup.number().required(),
            })}
            onSubmit={values => {
              onSubmit?.(values);
            }}
          >
            {({submitForm}) => (
              <>
                <DialogTitle>
                  上位机设置
                </DialogTitle>
                <DialogContent>
                  <Form>
                    <FormControl fullWidth margin="dense">
                      <InputLabel id="demo-simple-select-label">端口号</InputLabel>
                      <Field
                        component={Select}
                        name="path"
                        MenuProps={{className: classes.paper}}
                      >
                        {
                          ports.map(item => (
                            <MenuItem key={item.path} value={item.path}>
                              <div className={classes.itemCon}>
                                <Typography variant='body1' color='textPrimary'>
                                  {item.path}
                                </Typography>
                                <Typography variant='body2' color='textSecondary'>
                                  {item.manufacturer}
                                </Typography>
                              </div>
                            </MenuItem>
                          ))
                        }
                      </Field>
                    </FormControl>
                    <FormControl fullWidth margin="dense">
                      <InputLabel id="demo-simple-select-label">波特率</InputLabel>
                      <Field
                        component={Select}
                        name="baudrate"
                        MenuProps={{className: classes.paper}}
                      >
                        {
                          [4800, 9600, 38400, 115200].map(item => (
                            <MenuItem key={item} value={item}>
                              {item}
                            </MenuItem>
                          ))
                        }
                      </Field>
                    </FormControl>
                  </Form>
                </DialogContent>
                <DialogActions>
                  <Button onClick={onCancel}>
                    取消
                  </Button>
                  <Button color='primary' type="submit" onClick={submitForm}>
                    连接
                  </Button>
                </DialogActions>
              </>
            )}
          </Formik>
        )
      }
    </Dialog>
  );
}
