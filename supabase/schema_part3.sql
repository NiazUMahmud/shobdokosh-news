-- PART 3: Seed products (run after part 1 and 2)

insert into public.products (name, description, price, original_price, images, category, subcategory, brand, stock, rating, review_count, featured, tags, specifications) values
('iPhone 15 Pro', 'The most advanced iPhone yet, featuring the powerful A17 Pro chip and titanium design.', 999, 1099,
 ARRAY['https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg'],
 'Electronics', 'Smartphones', 'Apple', 50, 4.8, 1247, true,
 ARRAY['smartphone','apple','pro','titanium'],
 '{"Screen Size":"6.1 inches","Storage":"128GB","Color":"Natural Titanium","Camera":"48MP Main"}'),

('MacBook Air M2', 'Supercharged by the next-generation M2 chip with incredible performance and 18-hour battery life.', 1199, null,
 ARRAY['https://images.pexels.com/photos/205421/pexels-photo-205421.jpeg'],
 'Electronics', 'Laptops', 'Apple', 25, 4.9, 892, true,
 ARRAY['laptop','apple','m2','portable'],
 '{"Screen Size":"13.6 inches","Processor":"Apple M2","Memory":"8GB","Storage":"256GB SSD"}'),

('Sony WH-1000XM5', 'Industry-leading noise cancellation with premium sound quality and all-day comfort.', 399, 449,
 ARRAY['https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg'],
 'Electronics', 'Audio', 'Sony', 100, 4.7, 2156, false,
 ARRAY['headphones','wireless','noise-canceling'],
 '{"Battery Life":"30 hours","Connectivity":"Bluetooth 5.2","Weight":"250g","Driver Size":"30mm"}'),

('Classic Denim Jacket', 'Timeless denim jacket crafted from premium cotton with a vintage-inspired wash.', 89, null,
 ARRAY['https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg'],
 'Fashion', 'Men''s Clothing', 'Urban Style', 75, 4.4, 324, false,
 ARRAY['jacket','denim','casual','vintage'],
 '{"Material":"100% Cotton","Fit":"Regular","Care":"Machine wash cold","Origin":"Made in USA"}'),

('Modern Office Chair', 'Ergonomic office chair with lumbar support and adjustable height for all-day comfort.', 299, 349,
 ARRAY['https://images.pexels.com/photos/1957477/pexels-photo-1957477.jpeg'],
 'Home & Garden', 'Furniture', 'WorkSpace Pro', 30, 4.6, 567, true,
 ARRAY['chair','office','ergonomic','adjustable'],
 '{"Material":"Mesh back, fabric seat","Weight Capacity":"300 lbs","Height Range":"42-46 inches","Warranty":"5 years"}'),

('Yoga Mat Premium', 'Non-slip yoga mat made from eco-friendly TPE material, perfect for all types of yoga.', 45, null,
 ARRAY['https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg'],
 'Sports & Outdoors', 'Fitness', 'ZenFlow', 200, 4.5, 743, false,
 ARRAY['yoga','mat','exercise','eco-friendly'],
 '{"Material":"TPE","Thickness":"6mm","Size":"72\" x 24\"","Weight":"2.5 lbs"}');
