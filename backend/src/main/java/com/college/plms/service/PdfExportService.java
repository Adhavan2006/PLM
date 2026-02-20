package com.college.plms.service;

import com.college.plms.model.Project;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
public class PdfExportService {

    public byte[] generateProjectReport(Project project) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            document.add(new Paragraph("Project Report").setFontSize(18).setBold());
            document.add(new Paragraph("Title: " + project.getTitle()));
            document.add(new Paragraph("Domain: " + project.getDomain()));
            document.add(new Paragraph("Stage: " + project.getStage()));
            document.add(new Paragraph("Status: " + project.getStatus()));
            document.add(new Paragraph("Student: " + project.getStudent().getFullName()));
            document.add(new Paragraph("Faculty: " + (project.getFaculty() != null ? project.getFaculty().getFullName() : "Not assigned")));
            
            document.add(new Paragraph("\nDescription:").setBold());
            document.add(new Paragraph(project.getDescription() != null ? project.getDescription() : "No description provided."));

            if (project.getTechStack() != null && !project.getTechStack().isEmpty()) {
                document.add(new Paragraph("\nTech Stack:").setBold());
                document.add(new Paragraph(project.getTechStack()));
            }
            
            // Add deadline if present
            if (project.getStageDeadline() != null) {
                document.add(new Paragraph("\nDeadline: " + project.getStageDeadline().toString()));
            }

            document.close();
        return baos.toByteArray();
    }
}
