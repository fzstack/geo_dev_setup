import React, { useEffect, useState } from "react";
import { DeviceStore, InitSeqConfigItem } from "@/store";
import { Avatar, Button, Chip, Dialog, DialogActions, DialogContent, DialogProps, IconButton, List, ListItem, ListItemAvatar, ListItemText, makeStyles, Typography } from "@material-ui/core";
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import AddIcon from '@material-ui/icons/Add';
import AttachmentIcon from '@material-ui/icons/Attachment';

const useInitSeqDialogStyle = makeStyles(theme => ({
  button: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  avatar: {
    backgroundColor: '#54838c',
  }
}));

type InitSeqDialogProps = {
  onSubmit: () => void,
  onCancel: () => void;
  store: DeviceStore;
};

export default function({onSubmit, onCancel, open, store, ...props}: Partial<InitSeqDialogProps> & Omit<DialogProps, 'onSubmit'>) {
  const classes = useInitSeqDialogStyle();
  const [currentItem, setcurrentItem] = useState<InitSeqConfigItem | null>(store!.currentSelectedItem);

  useEffect(() => {
    if(!open) {
      setcurrentItem(store!.currentSelectedItem);
    }
  }, [open]);

  return (
    <Dialog open={open} {...props}>
      <MuiDialogTitle disableTypography >
        <Typography variant="h6">初始化序列</Typography>
      </MuiDialogTitle>
      <DialogContent>
      {
        store?.initSeqConfigItems?.map(item => (
          <Chip
            key={item.index}
            label={item.name}
            className={classes.chip}
            onClick={() => {
              setcurrentItem(item);
            }}
            onDelete={() => {}}
            color={item == currentItem ? 'primary' : 'default'}
          />
        ))
      }
      <IconButton size='small'>
        <AddIcon />
      </IconButton>
      <List dense>
        {
          currentItem?.seq.map(item => (
            <ListItem key={item.cmd} button>
              <ListItemAvatar>
                <Avatar className={classes.avatar}>
                  <AttachmentIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={item.desc} secondary={item.cmd}/>
            </ListItem>
          ))
        }
      </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>
          取消
        </Button>
        <Button color='primary' type="submit" onClick={() => {
          store?.selectItem(currentItem);
          if(onSubmit !== undefined) onSubmit();
        }}>
          选择
        </Button>
      </DialogActions>
    </Dialog>
  );
};
