@echo off

set appcmd=%systemroot%\system32\inetsrv\AppCmd.exe


%appcmd% set config /section:staticContent /+"[fileExtension='.svg',mimeType='image/svg+xml']"
%appcmd% set config /section:staticContent /+"[fileExtension='.eot',mimeType='application/vnd.ms-fontobject']"
%appcmd% set config /section:staticContent /+"[fileExtension='.woff',mimeType='application/x-font-woff']"
%appcmd% set config /section:staticContent /+"[fileExtension='.otf',mimeType='application/octet-stream']"
%appcmd% set config /section:staticContent /+"[fileExtension='.ttf',mimeType='application/octet-stream']"

pause