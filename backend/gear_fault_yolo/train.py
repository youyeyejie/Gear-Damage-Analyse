import torch
import yaml
import os
from pathlib import Path
from config import Config

def train(cfg):
    print('\n','=' * 25, '\tin','\033[3;34mtrain.py\033[0m\t', '=' * 25,'\n')

    cfg.plantform = os.name
    working_dir = os.getcwd()

    if os.path.exists(os.path.join(working_dir, 'model-yolov5s.pt')):
        print("模型已存在。跳过训练。")
    else: 
        print("未在该级目录下找到\'\033[3;34mmodel-yolov5s.pt\033[0m\'文件。\n开始训练模型。")
        if cfg.plantform == 'nt':
            os.system('train.bat')
        elif cfg.plantform == 'posix':
            os.system('./train.sh')
        else: 
            print('未知平台。程序将其作为windows处理。')
            os.system('train.bat')

if __name__ == '__main__':
    cfg = Config()
    train(cfg)