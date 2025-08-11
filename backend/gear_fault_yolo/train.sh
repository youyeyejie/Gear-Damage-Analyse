#!/bin/bash

python ./yolov5/train.py --img 640 --batch 16 --epochs 300 --data data.yaml --weights yolov5s.pt --rect --patience 100 --freeze 6 --hyp ./yolov5/data/hyps/hyp.scratch-high.yaml

cd yolov5/runs/train
latest_exp=$(ls -d exp* | sort -V | tail -n 1)
cd "$latest_exp"
cd weights
cp best.pt ../../../../../model-yolov5s.pt
cd ../../../../../