import struct, datetime
import zlib, gzip, base64
import hashlib
import os, sys, re, glob
import binascii
import argparse

check_json = True
json_errors = False
try:
    import demjson
except ImportError: check_json = False



parser = argparse.ArgumentParser(description='Create http site downloadable image')
parser.add_argument('infile',  help='project file that describe site content', default='webst.ctl')
parser.add_argument('outfile', help='output binary or header file name', default='webst.h')
parser.add_argument('-e','--enc',   help='encoding of file names and other text data',default='ascii')
parser.add_argument('-c','--nocomp', dest='autocompress', help='no autocompress output', default=True,action='store_false')
parser.add_argument('-s','--nominify', dest='minify', help='no autocompress output', default=True,action='store_false')
parser.add_argument('-t','--notag',  dest='etag',help='no authomatic ETag calculation',default=True,action='store_false')
parser.add_argument('-m','--nomd5',  dest='md5', help='no authomatic md5 calculation',default=True,action='store_false')
parser.add_argument('-d','--nomod',  dest='filedata', help='not insert last modified data',default=True,action='store_false')
parser.add_argument('-o','--oldnet', dest='hdrmax', help='use old MOD_OS NET header base',default=True,action='store_false')

arg = vars(parser.parse_args())

#arg = sys.argv[1:]
#arg = ["D:\\Projects\\modem\\web\\webst.ctl","D:\\TEMP\\projects\\mod_os\\051\\webst.h"]
#settings = {'enc':'ascii','autocompress':True,'etag':True,'filedata':True,'md5':True}

names = (	"Accept", "Accept-Charset",	"Accept-Encoding",	"Accept-Language", 	"Accept-Ranges", "Age",	"Allow", "Authorization",
    "Cache-Control", "Cookie","Connection","Content-Encoding","Content-Language", "Content-Length",	"Content-Location",	"Content-MD5","Content-Range", "Content-Type",
    "Date",	"ETag",	"Expect", "Expires", "From", "Host", "If-Match",	"If-Modified-Since", "If-None-Match", "If-Range", "If-Unmodified-Since",
    "Keep-Alive", "Last-Modified","Location", "Max-Forwards","MIME-Version", "Pragma", "Range", "Referer",	"Retry-After", "Set-Cookie", "Server",
    "TE", "Title", "Trailer", "Transfer-Encoding", "Upgrade", "User-Agent", "Vary", "Via", "Warning", "WWW-Authenticate")

QUERY_BASE = 100
if not arg['hdrmax']: print('old QUERY_BASE');QUERY_BASE=50

keys = {names[i]:i for i in range(len(names))}

def write_attr(f,id,value):
    f.write(struct.pack("IB",len(value)+1,id))
    f.write(value)
    f.write(b'\0')
    tail = (len(value) + 6) % 4
    if tail!=0:	f.write((b"\0\0\0",b"\0\0",b"\0")[tail-1])

def write_body(f,id,value):
    f.write(struct.pack("IB",len(value),id))
    f.write(value)
    tail = (len(value) + 5) % 4
    if tail!=0:	f.write((b"\0\0\0",b"\0\0",b"\0")[tail-1])

def is_minified(fn):
    filename = fn.split(';')[0]
    for ext in ['js','css','htm','html']:
        if filename.endswith('.'+ext) and not (filename.endswith('min.'+ext) or filename.endswith('.dbg.'+ext) ): return ext
    return 0

def get_files(filename):
    fn = filename.split(';')
    ret = []
    for f in fn:
        files = glob.glob(f)
        if len(files): ret.extend(files)
    return ret

def get_filedata(filename):
    ret = b''
    #for f in glob.glob(filename):
    for f in get_files(filename):
        ret+=open(f,'rb').read()
    return ret

def get_filetmstamp(filename):
    ret = False
    #for f in glob.glob(filename):
    for f in get_files(filename):
        ftime=datetime.datetime.fromtimestamp(os.path.getmtime(f))
        if not ret: ret=ftime
        elif ftime>ret: ret=ftime
    if not ret: ret = datetime.datetime.now()
    return ret

def handle_file(prop, f):
    for p in list(prop.items()): print('key:{0} value:{1}'.format(p[0],p[1]))
    print('-'*30)
    name = prop.get('Name','')
    if (len(name)==0):
        if 'File' in prop: name = prop['File']
        else: print("Entry without name");	return
    prop.pop('Name')
    write_attr(f,QUERY_BASE+1,name.encode(arg['enc']))
    filename = prop.get('File','')
    if len(filename)==0:
        #if 'Location' in prop: prop['Content-Location']=prop.pop('Location') # это перенаправление файл и не нужен
        if not 'Content-Location' in prop: filename = name # если нет имени файла считаем им имя ресурса
    else: prop.pop('File')
    if 'Authorize' in prop:
        prop['Authorization']=prop['Authorize']
        prop.pop('Authorize')
    # к этому моменту в словаре исключительно заголовки. Имя ресурса и имя файла ресурса исключены
    for p in list(prop.items()):
        if p[0]=='Last-Modified': # обработка даты
            dt = datetime.datetime.strptime(p[1].split['GMT'][0].strip(),"%a, %d %b %Y %H:%M:%S")-datetime.datetime(2000,1,1)
            f.write(struct.pack("IB",4,keys[p[0]]))
            f.write(struct.pack("IBBB",int(dt.total_seconds()),0,0,0))
        elif p[0]=='ETag': # обработка ETag
            f.write(struct.pack("IB",4,keys[p[0]]))
            f.write(struct.pack("IBBB",int(p[1],16),0,0,0))
        elif p[0]=='Authorization':
            value = 1
            if p[1].upper()=='FALSE': value = 0
            f.write(struct.pack("IBBBB",1,keys['Authorization'],value,0,0))
        else: # обработка текстовых атрибутов
            if (p[0] in keys): write_attr(f,keys[p[0]],p[1].encode(arg['enc']))
            else: print("Unknown HTML attribute ({0}) in {'1'} name".format(p[0],name)); return
    if ('Content-Location' in prop) or ('Location' in prop): return # для перенаправления остальное не нужно
    # считывание файла целиком (он не может быть большой, или не поместится в кассу)
    filedata = get_filedata(filename)
    if filename.endswith('.json') and check_json:
        lint = demjson.jsonlint( program_name=sys.argv[0] )
        rc = lint.main( filename )
        if rc!=0: json_errors=True
    if arg['minify']:
        ext = is_minified(filename)
        if ext!=0:
            print('using minification for ',name)
            minifname = 'minifname.'+ext
            open(minifname,'wb').write(filedata)
            outputname = 'minified.min.'+ext
            comppath = os.path.dirname(os.path.realpath(__file__))
            if ext=='js': os.system('java -jar '+comppath+'/yuicompressor-2.4.6.jar %s -o %s --charset utf-8'%(minifname,outputname))
            elif ext=='css': os.system('java -jar '+comppath+'/yuicompressor-2.4.6.jar %s -o %s --charset utf-8'%(minifname,outputname))
            else: os.system('java -jar '+comppath+'/htmlcompressor-1.5.3.jar --compress-js --compress-css -o %s %s --charset utf-8'%(outputname,minifname))
            if os.path.exists(outputname):
                fileout = open(outputname,'rb').read()
                if len(fileout):
                    print('minify success')
                    filedata = fileout
                os.remove(outputname)
            os.remove(minifname)
    if 'Content-Encoding' in prop:
        if prop['Content-Encoding']=='deflate':	filedata = zlib.compress(filedata)
        elif prop['Content-Encoding']=='gzip':
            gzf = gzip.open(filename+'.gz','wb')
            gzf.write(filedata)
            gzf.close()
            filedata = open(filename+'.gz','rb').read()
            os.remove(filename+'.gz')
    elif arg['autocompress']:
        zdata = zlib.compress(filedata)
        if len(filedata)-len(zdata) > len(filedata)/10:
            filedata = zdata
            print('using autocompress for ',name)
            write_attr(f,keys['Content-Encoding'],b'deflate')
    # передача дополнительных атрибутов
    if (not 'ETag' in prop) and arg['etag']:
        f.write(struct.pack("IB",4,keys['ETag']))
        f.write(struct.pack("IBBB",zlib.crc32(filedata),0,0,0))
        print('calculate ETag for ',name)
    if (not 'Content-MD5' in prop) and arg['md5']:
        write_attr(f,keys['Content-MD5'],base64.encodestring(hashlib.md5(filedata).digest()).strip())
        print('calculate md5 for ',name)
    if (not 'Last-Modified' in prop) and arg['filedata']:
        dt = get_filetmstamp(filename)-datetime.datetime(2000,1,1)
        f.write(struct.pack("IB",4,keys['Last-Modified']))
        f.write(struct.pack("IBBB",int(dt.total_seconds()),0,0,0))
        print('set modification time for ',name)

    # передача файла
    write_body(f,QUERY_BASE+5,filedata)

outfile = arg['outfile']
filext = os.path.splitext(outfile)
if (filext[1]=='.h') or (filext[1]=='.dwl'): outfile = filext[0]+'.bin'
outf = open(outfile,"wb")
inf = open(arg['infile'],"r")
curr_dir = os.getcwd()
filepath = os.path.dirname(arg['infile'])
if (len(filepath)): 
    os.chdir(filepath)
    arg['infile'] = os.path.basename(arg['infile'])
try:
    filedescr = {}
    for line in inf:
        if (len(line.strip())==0) and (len(filedescr)!=0):
            handle_file(filedescr,outf)
            filedescr = {}
        line = line.split('#')[0]
        #print(line)
        if len(line)!=0:
            pair = line.split('=')
            if len(pair)<2: continue
            elif len(pair)==2: filedescr[pair[0].strip()] = pair[1].strip()
            else: filedescr[pair[0].strip()] = ('='.join(pair[1:])).strip()
    if len(filedescr): handle_file(filedescr,outf)
    outf.write(b'\0\0\0\0\0')
    outf.close()
    inf.close()
finally:
    os.chdir(curr_dir)
if json_errors:
    print('Errors detected.')
    sys.exit(1)
if (filext[1]=='.h') or (filext[1]=='.dwl'):
    outf = open(arg['outfile'],"wb")
    inf = open(outfile,"rb")
    if filext[1]=='.h':
        outf.write(b"const unsigned char tlw_site[] = {\r\n")
        cnt = 0
        for dig in re.findall(b'..',binascii.hexlify(inf.read())):
            if cnt==16: outf.write(b"\r\n"); cnt = 0
            outf.write(b"0x"+dig+b",")
            cnt+=1
        outf.write(b"};\r\n")
        outf.write(b"const unsigned int tlw_date = ")
        dt = datetime.datetime.utcnow()-datetime.datetime(2000,1,1)
        outf.write(str(int(dt.total_seconds())).encode(arg['enc']))
        outf.write(b";\r\n")
        outf.close()
        inf.close()
        os.remove(outfile)
