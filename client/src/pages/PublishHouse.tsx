import React, { useState } from 'react';
import { Form, Input, Button, Upload, Select, InputNumber, Card, Typography, message } from 'antd';
import { UploadOutlined, HomeOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useNavigate } from 'react-router-dom';
import { houseAPI } from '../services/api';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface PublishHouseFormData {
  title: string;
  description: string;
  location: string; // 改为 location
  district: string; // 添加 district
  price: number;
  area: number;
  orientation: string;
  decoration: string;
  houseType: string;
  floor: string; // 添加 floor
  facilities: string[];
  images: UploadFile[];
  [key: string]: any;
}

const PublishHouse: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const navigate = useNavigate();

  const onFinish = async (values: PublishHouseFormData) => {
    setLoading(true);
    
    try {
      // 创建FormData对象用于上传文件
      const formData = new FormData();
      
      // 添加基本信息
      Object.keys(values).forEach(key => {
        if (key !== 'images') {
          if (key === 'facilities') {
            // 处理设施数组
            if (Array.isArray(values[key])) {
              values[key].forEach((facility: string) => {
                formData.append('facilities', facility);
              });
            }
          } else {
            formData.append(key, values[key].toString());
          }
        }
      });
      
      // 添加图片文件
      fileList.forEach(file => {
        if (file.originFileObj) {
          formData.append('images', file.originFileObj);
        }
      });
      
      // 发送请求
      await houseAPI.createHouse(formData);
      
      message.success('房源发布成功！');
      navigate('/my-houses');
    } catch (error) {
      message.error('发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };
  
  const handleChange = ({ fileList }: { fileList: UploadFile[] }) => {
    setFileList(fileList);
  };

  return (
    <div className="publish-house-container" style={{ maxWidth: '800px', margin: '20px auto' }}>
      <Card>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '30px' }}>发布房源</Title>
        
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[
              { required: true, message: '请输入房源标题' },
              { min: 5, max: 100, message: '标题长度必须在5-100个字符之间' }
            ]}
          >
            <Input prefix={<HomeOutlined />} placeholder="请输入房源标题" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
            rules={[
              { required: true, message: '请输入房源描述' },
              { min: 10, max: 1000, message: '描述长度必须在10-1000个字符之间' }
            ]}
          >
            <TextArea rows={4} placeholder="请详细描述房源情况" />
          </Form.Item>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="district"
              label="所在区域"
              rules={[{ required: true, message: '请选择所在区域' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择区域">
                <Option value="朝阳区">朝阳区</Option>
                <Option value="海淀区">海淀区</Option>
                <Option value="西城区">西城区</Option>
                <Option value="东城区">东城区</Option>
                <Option value="丰台区">丰台区</Option>
                <Option value="石景山区">石景山区</Option>
                <Option value="昌平区">昌平区</Option> 
              <Option value="顺义区">顺义区</Option>
              <Option value="通州区">通州区</Option>
              <Option value="大兴区">大兴区</Option>
              <Option value="房山区">房山区</Option>
              <Option value="门头沟区">门头沟区</Option>
              <Option value="平谷区">平谷区</Option>
              <Option value="怀柔区">怀柔区 </Option>

              </Select>
            </Form.Item>
          
            <Form.Item
              name="location"
              label="详细地址"
              rules={[{ required: true, message: '请输入详细地址' }]}
              style={{ flex: 2 }}
            >
              <Input prefix={<EnvironmentOutlined />} placeholder="请输入详细地址" />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="price"
              label="月租金(元)"
              rules={[{ required: true, message: '请输入租金' }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入月租金" />
            </Form.Item>
            
            <Form.Item
              name="area"
              label="面积(平方米)"
              rules={[{ required: true, message: '请输入面积' }]}
              style={{ flex: 1 }}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入面积" />
            </Form.Item>
          </div>
          
          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="houseType"
              label="房型"
              rules={[{ required: true, message: '请选择房型' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择房型">
                <Option value="一室一厅">一室一厅</Option>
                <Option value="两室一厅">两室一厅</Option>
                <Option value="两室两厅">两室两厅</Option>
                <Option value="三室一厅">三室一厅</Option>
                <Option value="三室两厅">三室两厅</Option>
                <Option value="四室两厅">四室两厅</Option>
                <Option value="其他">其他</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="floor"
              label="楼层"
              rules={[{ required: true, message: '请输入楼层信息' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="如：5/10层" />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Form.Item
              name="orientation"
              label="朝向"
              rules={[{ required: true, message: '请选择朝向' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择朝向">
                <Option value="东">东</Option>
                <Option value="南">南</Option>
                <Option value="西">西</Option>
                <Option value="北">北</Option>
                <Option value="东南">东南</Option>
                <Option value="东北">东北</Option>
                <Option value="西南">西南</Option>
                <Option value="西北">西北</Option>
                <Option value="南北通透">南北通透</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="decoration"
              label="装修情况"
              rules={[{ required: true, message: '请选择装修情况' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="请选择装修情况">
                <Option value="毛坯">毛坯</Option>
                <Option value="简装">简装</Option>
                <Option value="精装">精装</Option>
                <Option value="豪装">豪装</Option>
              </Select>
            </Form.Item>
          </div>
          
          <Form.Item
            name="facilities"
            label="配套设施"
            rules={[{ required: true, message: '请选择配套设施' }]}
          >
            <Select mode="multiple" placeholder="请选择配套设施">
              <Option value="空调">空调</Option>
              <Option value="洗衣机">洗衣机</Option>
              <Option value="冰箱">冰箱</Option>
              <Option value="热水器">热水器</Option>
              <Option value="电视">电视</Option>
              <Option value="宽带">宽带</Option>
              <Option value="燃气">燃气</Option>
              <Option value="暖气">暖气</Option>
              <Option value="电梯">电梯</Option>
              <Option value="停车位">停车位</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="images"
            label="上传图片"
            valuePropName="fileList"
            getValueFromEvent={normFile}
            rules={[{ required: true, message: '请上传至少一张房屋照片' }]}
          >
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleChange}
              beforeUpload={() => false}
              maxCount={6}
            >
              {fileList.length < 6 && <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传</div>
              </div>}
            </Upload>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
              发布房源
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default PublishHouse; 