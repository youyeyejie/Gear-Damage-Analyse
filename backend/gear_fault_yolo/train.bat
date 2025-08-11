@echo off

python ./yolov5/train.py --img 640 --batch 16 --epochs 300 --data data.yaml --weights yolov5s.pt --rect --patience 100 --freeze 8 --hyp ./yolov5/data/hyps/hyp.scratch-high.yaml

cd yolov5\runs\train

for /f "tokens=*" %%i in ('powershell -command "Get-ChildItem -Directory -Filter exp* | Sort-Object {[int]($_.Name -replace 'exp', '')} | Select-Object -Last 1 -ExpandProperty Name"') do (
    cd %%i
)

cd weights

@copy best.pt ..\..\..\..\..\model-yolov5s.pt >nul

cd ..\..\..\..\..\

