import { remote, shell } from "electron";
import React, { useState } from "react";
import confMan from '@/conf_man';
import { Button, Dialog, DialogActions, DialogContent, DialogProps, IconButton, Link, makeStyles, Typography } from "@material-ui/core";
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';

const useDictDialogStyle = makeStyles(theme => ({
  button: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
  },
  root: {
    minWidth: 300,
  },
}));

type DictDialogProps = {
  onSubmit: (path: string) => void,
  onCancel: () => void;
};

export default function({onSubmit, onCancel, ...props}: Partial<DictDialogProps> & Omit<DialogProps, 'onSubmit'>) {
  const classes = useDictDialogStyle();
  const [path, setPath] = useState<string | null>(confMan.get('dataDictPath') as string ?? null);
  return (
    <Dialog classes={{paper: classes.root}} {...props}>
      <MuiDialogTitle disableTypography >
        <Typography variant="h6">数据字典</Typography>
        <IconButton className={classes.button} onClick={async () => {
          const res = await remote.dialog.showOpenDialog({
            properties: ['openFile'],
            title: '选择数据字典文件',
            buttonLabel: '选择',
            filters: [
              {
                name: 'excel文件',
                extensions: ['xlsx'],
              }
            ]
          });
          if(res.canceled) return;
          console.log(res);
          setPath(res.filePaths[0]);
        }}>
          <FolderOpenIcon />
        </IconButton>
      </MuiDialogTitle>
      <DialogContent>
        当前路径:
        {
          path == null ? (
            <Typography color={'error'}>
              未指定
            </Typography>
          ) : (
            <Typography color={'primary'}>
              <Link onClick={() => {
                shell.openExternal(path);
              }} component='button'>
                {path}
              </Link>
            </Typography>
          )
        }
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>
          取消
        </Button>
        <Button color='primary' type="submit" onClick={() => {
          if(path != null) {
            onSubmit?.(path);
          }
        }}>
          确认
        </Button>
      </DialogActions>
    </Dialog>
  );
}
