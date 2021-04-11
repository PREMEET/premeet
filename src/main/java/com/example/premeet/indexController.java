package com.example.premeet;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;

@Controller
public class indexController {

    int i =0;
    @ResponseBody
    @PostMapping("/save")
    private static String save(@RequestParam(value = "file") MultipartFile multipartFile) {
        System.out.println(multipartFile.getOriginalFilename());
        System.out.println(multipartFile.getSize());
//        String folderPath = System.getProperty("user.dir") + "\\bin\\main\\static\\output";
        String folderPath = System.getProperty("user.dir") + "\\src\\main\\resources\\static\\output";
        System.out.println(folderPath);
        File folder = new File(folderPath);
        if(!folder.exists()) {
            folder.mkdirs();
        }

        File saveFile = new File(folderPath,  multipartFile.getOriginalFilename()+".webm");
        try {
            multipartFile.transferTo(saveFile);
        }catch (Exception e) {
            e.printStackTrace();
        }

        return "Ok";
    }

    @ResponseBody
    @PostMapping("/cap")
    private String capture(@RequestParam(value = "capture") MultipartFile multipartFile) {
        System.out.println(multipartFile.getOriginalFilename());
        System.out.println(multipartFile.getSize());
        String folderPath = System.getProperty("user.dir") + "\\src\\main\\resources\\static\\output";
        File destFile = new File(folderPath+"\\"+"img"+i+".png");
        i++;

        BufferedImage bImage;
        try {
            bImage = ImageIO.read(multipartFile.getInputStream());
            BufferedImage result = new BufferedImage(bImage.getWidth(), bImage.getHeight(), BufferedImage.TYPE_INT_RGB);
            result.createGraphics().drawImage(bImage, 0, 0, Color.white,null);
            ImageIO.write(result, "png", destFile);
        } catch (IOException e) {
            e.printStackTrace();
        }
        SimpleDateFormat format1 = new SimpleDateFormat ( "yyyy-MM-dd HH:mm:ss");
        System.out.println(format1.format(System.currentTimeMillis()));
        return "Ok";
    }

    @GetMapping("/gaze")
    private String webgaze() {
        return "webgaze";
    }
}
