import os
import sys
import yaml

class Config:
    def __init__(self):
        """初始化配置类"""
        with open('config.yaml', 'r', encoding='utf-8') as f:
            self.config = yaml.safe_load(f)
            
        # 文件夹设置
        self.images_path = self.config['images_path']
        self.metallurgical_path = self.config['metallurgical_path']
        self.normal_path = self.config['normal_path']
        self.labels_path = self.config['labels_path']
        self.result_path = self.config['result_path']
        self.plantform = 'nt'
        
        # 数据集设置
        self.train = self.config['train']
        self.val = self.config['val']
        self.nc = self.config['nc']
        self.names = self.config['names']
        
        # 模型设置和数据增强设置还没有接入，现在不会有用。
        # 模型设置
        self.device = self.config['device']
        self.epochs = self.config['epochs']
        self.batch_size = self.config['batch_size']
        self.img_size = self.config['img_size']
        self.lr0 = self.config['lr0']
        self.weight_decay = self.config['weight_decay']
        
        # 数据增强设置
        self.hsv_h = self.config['hsv_h']
        self.hsv_s = self.config['hsv_s']
        self.hsv_v = self.config['hsv_v']
        self.translate = self.config['translate']
        self.scale = self.config['scale']
        self.mosaic = self.config['mosaic']
        self.rect = self.config['rect']